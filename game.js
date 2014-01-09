/** AI Challenge Dominion
 *  (c) 2014 Sam Donow
 *  The Williams Game Jam 2014 
 */

include('utils.js')
include('cards.js')

/** GUI Constants */
var CARD_WIDTH  = 200
var CARD_HEIGHT = 50

/** Game State constants */

/** The piles of purchasable cards */
var cardsInPlay;

/** The players in the game */
var playerList;

/** The trash zone's cards, as it is shared */
var trash;

/** Actions, buys, gold for the current player */
var state;

/** For determining the meaning of input */
var inputState
var WANT_NONE     = 0 
var WANT_TREASURE = 1
var WANT_ACTION   = 2
var WANT_BUY      = 3

/** Displays a card at location x,y on the screen*/
function displayCard(card, x, y, index) {
    var color
    if (card.type === VICTORY) {
        color = '#00FF00'
    } else if (card === COPPER) {
        color = '#DF7401'
    } else if (card === SILVER) {
        color = '#848484'
    } else if (card === GOLD) {
        color = '#D7DF01'
    } else if (card === CURSE) {
        color = '#9A2EFE'
    } else {
        color = '#D8D8D8'
    }
    strokeRectangle(x, y, CARD_WIDTH, CARD_HEIGHT, 'black', 2)
    fillRectangle(x, y, CARD_WIDTH, CARD_HEIGHT, color)
    fillText(card.name, x, 20+y, 'black', "bold 24px sans-serif")
    fillText(card.cost, (CARD_WIDTH-20)+x, 25+y, 'black', "bold 30px sans-serif")
    if (index >= 0) {
        fillText(cardsInPlay[index].count, (CARD_WIDTH-70)+x, 45+y, 'black', "bold 24px sans-serif")
    }
}

function displayState() {
    fillRectangle(0,0,screenWidth,screenHeight,'white')
    fillText("Player " + (state.turn + 1) + "'s turn", screenWidth-200, 30, 'black', "bold 24px sans-serif")
    fillText("Actions: " + (state.actions), screenWidth-200, 60, 'black', "bold 24px sans-serif")
    fillText("Buys: " + (state.buy), screenWidth-200, 90, 'black', "bold 24px sans-serif")
    fillText("Gold: " + (state.gold), screenWidth-200, 120,'black', "bold 24px sans-serif")
    for (var i = 0; i < cardsInPlay.length; ++i) {
        displayCard(cardsInPlay[i].card, (i%4)*(CARD_WIDTH*1.1),floor(i/4)*(CARD_HEIGHT*1.1), i)
    }
}

function displayHand() {
    var player = playerList[state.turn]
    for (var i = 0; i < player.hand.length; ++i) {
        displayCard(player.hand[i], (i%5)*CARD_WIDTH*1.1, screenHeight - (3 - floor(i/5))*(CARD_HEIGHT*1.1), -1)
    }
}

/** Returns how many of a card are left to be purchased */
function countInPlay(card) {
    return cardsInPlay[pileIndex(card)].count
}

/** Find the index of a card in the piles */
function pileIndex(card) {
    for (var i = 0; i < cardsInPlay.length; ++i) {
        if (cardsInPlay[i].card === card) {
            return i
        }
    }
    return -1
}

/** The passed player obtains the card, if available;
 *  Also returns whether the card could successfully be gained
 */
function gainCard(player, card) {
    if (countInPlay(card) > 0) {
        player.discard.push(card)
        --cardsInPlay[i].count
        return true
    }
    return false
}

/** Function for generating a player object using an index for the
    player*/
function Player(i, isHuman) {
    return { number : i,
             deck   : startingDeck(),
             hand   : new Array(),
             discard: new Array(),
             human  : isHuman }
}

/** Returns the default starting deck */
function startingDeck() {
    return [COPPER, COPPER, COPPER, COPPER, COPPER,
            COPPER, COPPER, ESTATE, ESTATE, ESTATE]
}
/** Discards a players current hand and draws a new one */
function newHand(player) {
    player.discard = player.discard.concat(player.hand)
    player.hand = new Array()
    drawCards(player,5)
}

/** Makes the given player draw n cards */
function drawCards(player, n) {
    for (var i = 0; i < n;) {
        if (player.deck.length > 0) {
            player.hand.push(player.deck.pop())
            ++i
        } else if (player.discard.length > 0) {
            player.deck = shuffle(player.deck.concat(player.discard))
            player.discard = new Array()
        } else {
            /** no cards left to draw */
            return
        }
    }
}

/** Initializes the piles in the beginning of the game, given
  * a set of cards */
function initializePiles(potentialCards) {
    var numPlayers = playerList.length
    var smallAmount= playerList.length < 3 ? 8 : 12
    cardsInPlay    = new Array()
    cardsInPlay[0] = { card: COPPER, count: 60 - 7*numPlayers}
    cardsInPlay[1] = { card: SILVER, count: 40}
    cardsInPlay[2] = { card: GOLD  , count: 30}
    cardsInPlay[3] = { card: CURSE , count: 10*(numPlayers)}
    cardsInPlay[4] = { card: ESTATE, count: smallAmount}
    cardsInPlay[5] = { card: DUCHY , count: smallAmount}
    cardsInPlay[6] = { card: PROVINCE, count: smallAmount}
    shuffle(potentialCards)
    for (var i = 0; i < 10; ++i) {
        cardsInPlay[7+i] = { card: potentialCards[i], 
            count: potentialCards[i].type === VICTORY ? smallAmount : 10 }
    }
}

/** Returns whether the game has ended and it is time to count
  * Victory points or not
  */
function gameIsOver() {
    if (countInPlay(PROVINCE) === 0) {
        return true
    }

    for (var i = 0; i < cardsInPlay.length; ++i) {
        var count = 0
        if (cardsInPlay[i].count === 0) {
            ++count
        }
    }
    return (count > 2)
}

function askForGold() {
    if (containsType(playerList[state.turn].hand, TREASURE)) {
        displayState()
        displayHand()
        fillText("Choose Treasure cards to play", 10, screenHeight/2 - 50, 'black','24px bold sans-serif')
        setTouchKeyRectangle(asciiCode('A'), 10,screenHeight/2, 140, 60, "All")
        setTouchKeyRectangle(asciiCode('D'), 10,screenHeight/2 + 100, 140, 60, "Done")
        drawTouchKeys()
        inputState = WANT_TREASURE
    } else {
        askForBuy()
    }
}

function askForBuy() {
    displayState()
    displayHand()
    fillText("Choose card to buy", 10, screenHeight/2 - 50, 'black','24px bold sans-serif')
    setTouchKeyRectangle(asciiCode('N'), 10,screenHeight/2, 140, 60, "None")
    drawTouchKeys()
    inputState = WANT_BUY
}

function askForAction() {
    displayState()
    displayHand()
    fillText("Choose an action to play", 10, screenHeight/2 - 50, 'black','24px bold sans-serif')
    inputState = WANT_ACTION
}

function containsType(hand, cardType) {
    for (var i = 0; i < hand.length; ++i) {
        if (hand[i].type === cardType) {
            return true
        }
    }
    return false
}
/** Takes a turn, either by asking a player for input or by following
 *  the rules of an AI
 */
function takeTurn(player) {
    if (!player.human) {
        //do AI stuff
        return false
    }
    if (state.actions > 0 && containsType(player.hand, ACTION) {
        displayState()
        displayHand()
        askForAction()
    } else {
        askForGold()
    }

}

/** Calculates the number of victory points had by the player
  * at the end of the game */
function calculateScore(player) {
    var score = 0
    player.deck = player.deck.concat(player.hand.concat(player.discard))
    for (var i = 0; i < player.deck.length; ++i) {
        var card = player.deck[i]
        if (card.type === VICTORY || card.type === CURSE) {
            score += card.vp()
        }
    }
    return score   
}

/** Modify state based on the properties of a card */
function applyProps(card, player) {
    state.actions += card.props.actions
    state.gold    += card.props.gold
    state.buy     += card.props.buy
    drawCards(player, card.props.cards)
}

/** EBegins the next turn of the game */
function nextTurn() {
    state = { actions: 1,
              buy:    1,
              gold:    0,
              inPlay:  new Array(),
              turn: (state.turn + 1)%playerList.length}
    if (!gameIsOver()) {
        takeTurn(playerList[state.turn])
    } else {
        var points = new Array()
        for (var i = 0; i < playerList.length; ++i) {
            points.push(calculateScore(playerList[i]))
        }
        /** Display winner, etc... */
    }
}

function endTurn() {
   inputState = WANT_NONE
    var player = playerList[state.turn]
    player.discard = player.discard.concat(state.inPlay)
    newHand(player)
    nextTurn()
}

function onSetup() {
    inputState = WANT_NONE
    playerList = new Array (Player(0, true), Player(1, true))
    initializePiles(ALLCARDS)
    for (var i = 0; i < playerList.length; ++i) {
        shuffle(playerList[i].deck)
        drawCards(playerList[i], 5)
    }
    state = {turn : -1}
    nextTurn()
}

function clickInCard(xstart, ystart) {
    return (x >= xstart && x <= xstart + CARD_WIDTH &&
            y >= ystart && y <= ystart + CARD_HEIGHT)
}

function onClick(x, y) {
    if (inputState === WANT_TREASURE || inputState === WANT_ACTION) {
        var card = NULLCARD
        var player = playerList[state.turn]
        var index = 0
        for (var i = 0; i < player.hand.length; ++i) {
            var xstart = (i%5)*CARD_WIDTH*1.1
            var ystart = screenHeight - (3 - floor(i/5))*(CARD_HEIGHT*1.1)
            if (clickInCard(xstart, ystart)) {
                card = player.hand[i]
                index = i
                break
            }
        }
        if (inputState === WANT_TREASURE && card !== NULLCARD 
            && card.type === TREASURE) {
            state.inPlay.push(card)
            state.gold += card.worth
            removeAt(player.hand, index)
            if (!containsType(player.hand, TREASURE)) {
                askForBuy()
            }
        } else if (inputState === WANT_ACTION && card !== NULLCARD 
            && card.type === ACTION) {
            state.inPlay.push(card)
            removeAt(player.hand, index)
            state.actions--
            applyProps(card)
            card.effect()
            if (state.actions <= 0 || !containsType(player.hand, ACTION)) {
                askForGold()
            }
        }
    } else if (inputState === WANT_BUY) {
        var card = NULLCARD
        var player = playerList[state.turn]
        var index = 0
        for (var i = 0; i < player.hand.length; ++i) {
            var xstart = (i%4)*(CARD_WIDTH*1.1)
            var ystart = floor(i/4)*(CARD_HEIGHT*1.1),
            if (clickInCard(xstart, ystart)) {
                card = player.hand[i]
                index = i
                break
            }
        }
    }
}

function onKeyStart(key) {
    if (inputState === WANT_TREASURE) {
        if (key === asciiCode('A')) {
            var player = playerList[state.turn]
            var places = new Array()
            for (var i = player.hand.length - 1; i >= 0; --i) {
                if (player.hand[i].type === TREASURE) {
                    var card = player.hand[i]
                    state.inPlay.push(card)
                    state.gold += card.worth
                    removeAt(player.hand, i)
                }
            }
            removeTouchKey(asciiCode('A'))
            removeTouchKey(asciiCode('D'))
            askForBuy()
        } else if (key === asciiCode('D')) {
            removeTouchKey(asciiCode('A'))
            removeTouchKey(asciiCode('D'))
            askForBuy()
        }
    } else if (inputState === WANT_BUY) {
        if (key === asciiCode('N')) {
            removeTouchKey(asciiCode('N'))
            endTurn()
        }
    }
}