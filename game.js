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
var WANT_HAND     = 4
var WANT_INPLAY   = 5

/** Will store a function for verifying choices are ok */
var verifyFunc;
var cardCallback;

/** Statements to be printed out to the game log */
var gameLog
var MAX_LOG_LENGTH = 15

var gameMessage = ""
var cardToDisplay = { text: "" }

function addToLog(statement) {
    while (gameLog.length >= MAX_LOG_LENGTH) {
        removeAt(gameLog, 0)
    }
    gameLog.push(statement)
}

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
    fillText("Buys: " + (state.buys), screenWidth-200, 90, 'black', "bold 24px sans-serif")
    fillText("Gold: " + (state.gold), screenWidth-200, 120,'black', "bold 24px sans-serif")
    fillText("Deck: " + (playerList[state.turn].deck.length),screenWidth-200, 150,'black', "bold 24px sans-serif")
    fillText(gameMessage, 10, screenHeight/2 - 50, 'black','24px bold sans-serif')
    for (var i = 0; i < cardsInPlay.length; ++i) {
        displayCard(cardsInPlay[i].card, (i%4)*(CARD_WIDTH*1.1),floor(i/4)*(CARD_HEIGHT*1.1), i)
    }
    var player = playerList[state.turn]
    for (var i = 0; i < player.hand.length; ++i) {
        displayCard(player.hand[i], (i%5)*CARD_WIDTH*1.1, screenHeight - (3 - floor(i/5))*(CARD_HEIGHT*1.1), -1)
    }
    for (var i = 0; i < gameLog.length; ++i) {
        fillText(gameLog[i], screenWidth* 3/4, screenHeight/2+30*i,'black', "bold 24px sans-serif")
    }
    drawTouchKeys()
    fillText(cardToDisplay.text, screenWidth*3/4, screenHeight/2-30, 'black', "bold 30px sans-serf")
}

function logEvent(description) {
    addToLog("Player " + (state.turn + 1) + " " + description)
}

/** Returns how many of a card are left to be purchased */
function countInPlay(card) {
    var index = pileIndex(card)
    if (index >= 0){
        return cardsInPlay[pileIndex(card)].count
    } else {
        return 0
    }
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
        --cardsInPlay[pileIndex(card)].count
        return true
    }
    return false
}

/** Returns a basic AI, that I will use for testing now */
function AIOne() {
    return [ { card: PROVINCE, cap: Infinity },
             { card: GOLD,     cap: Infinity },
             { card: LABORATORY, cap: 5},
             { card: MONEYLENDER, cap: 1},
             { card: SILVER,   cap: 6},
             { card: DUCHY,    cap: Infinity}]
}
/** Function for generating a player object using an index for the
    player*/
function Player(i, isHuman) {
    return { number : i,
             deck   : startingDeck(),
             hand   : new Array(),
             discard: new Array(),
             human  : isHuman,
             ai     : !isHuman ? AIOne() : 0 }
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
        gameMessage = "Choose Treasure cards to play"
        displayState()
        setTouchKeyRectangle(asciiCode('A'), 10,screenHeight/2, 140, 60, "All")
        setTouchKeyRectangle(asciiCode('D'), 10,screenHeight/2 + 100, 140, 60, "Done")
        drawTouchKeys()
        inputState = WANT_TREASURE
    } else {
        askForBuy()
    }
}

function askForBuy() {
    gameMessage = "Choose card to buy"
    displayState()
    setTouchKeyRectangle(asciiCode('N'), 10,screenHeight/2, 140, 60, "None")
    drawTouchKeys()
    inputState = WANT_BUY
}

function askForAction() {
    gameMessage = "Choose an action to play"
    displayState()
    setTouchKeyRectangle(asciiCode('N'), 10,screenHeight/2, 140, 60, "None")
    drawTouchKeys()
    inputState = WANT_ACTION
}

function askForHand() {
    gameMessage = "Choose a card in your hand"
    displayState()
    setTouchKeyRectangle(asciiCode('N'), 10,screenHeight/2, 140, 60, "None")
    drawTouchKeys()
    inputState = WANT_HAND
}

function askForInPlay() {
    gameMessage = "Choose a card to gain"
    displayState()
    setTouchKeyRectangle(asciiCode('N'), 10,screenHeight/2, 140, 60, "None")
    drawTouchKeys()
    inputState = WANT_INPLAY
}

function containsType(hand, cardType) {
    for (var i = 0; i < hand.length; ++i) {
        if (hand[i].type === cardType) {
            return true
        }
    }
    return false
}

function getBestAction(player) {
    var ret = NULLCARD
    for (var i = 0; i < player.hand.length; ++i) {
        var card = player.hand[i]
        if (card.type === ACTION) {
            if (card.props.actions > 0) {
                return card
            } else {
                ret = card
            }
        }
    }
    return ret
}

/** Asks the player to choose a card to gain that matches the 
 *  characteristics defined by the vFunc */
function askPlayerToGainCard(player, vFunc, callbackFunc) {
    if (player.human) {
        verifyFunc = vFunc
        cardCallback = callbackFunc
        askForInPlay()
    } else {
        for (var i = 0; i < cardInPlay.length; ++i) {
            if (vFunc(cardsInPlay[i].card) && cardsInPlay[i].count > 0) {
                callbackFunc(player, cardsInPlay[i].card)
                break
            }
        }
    }
}

/** Asks player for a card in their hand of the given chars
 *  AI will use aiFunc in order to decide on a card */
function askPlayerForCard(player, vFunc, aiFunc, callbackFunc) {
    if (player.human) {
        verifyFunc = vFunc
        cardCallback = callbackFunc
        askForHand()
    } else {
        for (var i = 0; i < player.hand.length; ++i) {
            if (vFunc(player.hand[i]) && aiFunc(player.hand[i])) {
                callbackFunc(player, player.hand[i])
                break
            }
        }
    }
}

/** Takes a turn, either by asking a player for input or by following
 *  the rules of an AI
 */
function takeTurn(player) {
    if (!player.human) {

        while (containsType(player.hand, ACTION) && state.actions > 0) {
            var card = getBestAction(player)
            playAction(player, card)
        }
        /** we iterate backwards so that removing cards from the hand is not an issue          */
        /** The AI always plays all their treasures, as there is never anything bad about this */
        for (var i = player.hand.length - 1; i >= 0; --i) {
            if (player.hand[i].type === TREASURE) {
                var card = player.hand[i]
                removeAt(player.hand,i)
                state.inPlay.push(card)
                state.gold += card.worth
                logEvent("played " + card.name)
            }
        }
        var priorityList = player.ai
        while (state.buys > 0) {
            var boughtCard = false
            for (var i = 0; i < priorityList.length; ++i) {
                var entry = priorityList[i]
                if (entry.card.cost <= state.gold && entry.cap > 0) {
                    if (gainCard(player, entry.card)) {
                        state.gold -= entry.card.cost
                        state.buys--
                        boughtCard = true
                        entry.cap--
                        logEvent("bought " + entry.card.name)
                    }
                }
            }
            if (!boughtCard) {
                state.buys = 0
            }
        }
        endTurn()

    } else {
        if (state.actions > 0 && containsType(player.hand, ACTION)) {
            displayState()
            askForAction()
        } else {
            askForGold()
        }
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
            score += card.vp(player)
        }
    }
    return score   
}

/** Modify state based on the properties of a card */
function applyProps(card, player) {
    state.actions += card.props.actions
    state.gold    += card.props.gold
    state.buys     += card.props.buy
    drawCards(player, card.props.cards)
}

/** EBegins the next turn of the game */
function nextTurn() {
    state = { actions: 1,
              buys:    1,
              gold:    0,
              inPlay:  new Array(),
              turn: (state.turn + 1)%playerList.length}
    logEvent("begins turn.")
    if (!gameIsOver()) {
        takeTurn(playerList[state.turn])
    } else {
        displayState()
        var points = new Array()
        for (var i = 0; i < playerList.length; ++i) {
            points.push(calculateScore(playerList[i]))
        }
        var winnerIndex = 0
        for (var i = 0; i < playerList.length; ++i) {
            if (points[i] > points[winnerIndex]) {
                winnerIndex = i
            }
        }
        for (var i = 0; i < playerList.length; ++i) {
            fillText("Player " + (i+1) + ": " + points[i] + (winnerIndex === i ?  " WINNER" : ""), screenWidth/2 ,screenHeight/2 + i* 60, 'black',"bold 40px sans-serif")
        }
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
    playerList = new Array (Player(0, true), Player(1, false))
    initializePiles(ALLCARDS)
    gameLog = ["Game Begins"]
    for (var i = 0; i < playerList.length; ++i) {
        shuffle(playerList[i].deck)
        drawCards(playerList[i], 5)
    }
    state = {turn : -1}
    trash = new Array()
    nextTurn()
}

function clickInCard(xstart, ystart, x, y) {
    return (x >= xstart && x <= xstart + CARD_WIDTH &&
            y >= ystart && y <= ystart + CARD_HEIGHT)
}

function playAction(player, card) {
    state.inPlay.push(card)
    player.hand.remove(card)
    state.actions--
    applyProps(card, player)
    card.effect(player)
    logEvent("played " + card.name)
}

function endAction(player) {
    if (state.actions <= 0 || !containsType(player.hand, ACTION)) {
        removeTouchKey(asciiCode('N'))
        askForGold()
    } else {
        askForAction()
    }
}

function onClick(x, y) {
    var card = NULLCARD
    var player = playerList[state.turn]
    var index = 0
    if (inputState === WANT_TREASURE || inputState === WANT_ACTION || inputState === WANT_HAND) {
        for (var i = 0; i < player.hand.length; ++i) {
            var xstart = (i%5)*CARD_WIDTH*1.1
            var ystart = screenHeight - (3 - floor(i/5))*(CARD_HEIGHT*1.1)
            if (clickInCard(xstart, ystart, x, y)) {
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
            logEvent("played " + card.name)
            if (!containsType(player.hand, TREASURE)) {
                removeTouchKey(asciiCode('A'))
                removeTouchKey(asciiCode('D'))
                askForBuy()
            } else {
                askForGold()
            }
        } else if (inputState === WANT_ACTION && card !== NULLCARD 
            && card.type === ACTION) {
            playAction(player, card)
            if (inputState === WANT_ACTION) {
                endAction(player)
            }
        } else if (inputState === WANT_HAND && card !== NULLCARD
            && verifyFunc(card)) {
            inputState = WANT_NONE
            removeTouchKey(asciiCode('N'))
            cardCallback(player, card)
        }
    } else if (inputState === WANT_BUY || WANT_INPLAY) {
        for (var i = 0; i < cardsInPlay.length; ++i) {
            var xstart = (i%4)*(CARD_WIDTH*1.1)
            var ystart = floor(i/4)*(CARD_HEIGHT*1.1)
            if (clickInCard(xstart, ystart, x, y)) {
                card = cardsInPlay[i].card
                index = i
                break
            }
        }
        if (inputState === WANT_BUY && card !== NULLCARD 
            && card.cost <= state.gold) {
            gainCard(player, card)
            state.gold -= card.cost
            state.buys--
            logEvent("bought " + card.name)
            if (state.buys <= 0) {
                removeTouchKey(asciiCode('N'))
                endTurn()
            } else {
                askForBuy()
            }
        } else if (inputState === WANT_INPLAY && card !== NULLCARD
            && verifyFunc(card)) {
            inputState = WANT_NONE
            removeTouchKey(asciiCode('N'))
            cardCallback(player, card)
        }
    }
}

function onKeyStart(key) {
    var player = playerList[state.turn]
    if (inputState === WANT_TREASURE) {
        if (key === asciiCode('A')) {
            for (var i = player.hand.length - 1; i >= 0; --i) {
                if (player.hand[i].type === TREASURE) {
                    var card = player.hand[i]
                    state.inPlay.push(card)
                    state.gold += card.worth
                    logEvent("played " + card.name)
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
    } else if (inputState === WANT_ACTION) {
        if (key === asciiCode('N')) {
            removeTouchKey(asciiCode('N'))
            askForGold()
        }
    } else if (inputState === WANT_HAND || inputState === WANT_INPLAY) {
        if (key === asciiCode('N')) {
            removeTouchKey(asciiCode('N'))
            cardCallback(player, NULLCARD)
        }
    }
}

function onMouseMove(x, y) {
    var card = NULLCARD
    var player = playerList[state.turn]
    for (var i = 0; i < player.hand.length; ++i) {
        var xstart = (i%5)*CARD_WIDTH*1.1
        var ystart = screenHeight - (3 - floor(i/5))*(CARD_HEIGHT*1.1)
        if (clickInCard(xstart, ystart, x, y)) {
            card = player.hand[i]
            break
        }
    }
    for (var i = 0; i < cardsInPlay.length; ++i) {
        var xstart = (i%4)*(CARD_WIDTH*1.1)
        var ystart = floor(i/4)*(CARD_HEIGHT*1.1)
        if (clickInCard(xstart, ystart, x, y)) {
            card = cardsInPlay[i].card
            break
        }
    }
    if (card !== NULLCARD) {
        cardToDisplay = card
        displayState()
    }
}