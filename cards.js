/** Card Data for Dominion
    (c) 2014 Sam Donow */


/** type variables */

var ACTION   = 0
var TREASURE = 1
var VICTORY  = 2
var CURSE    = 3

/** subtype variables */

var NONE     = 0 
var REACTION = 1
var ATTACK   = 2


/** card helper functions */

function allOthersGain(player, card) {
    for (var i = 0; i < playerList.length; ++i) {
        if (i !== player.number) {
            gainCard(playerList[i], card)
        }
    }
}

function allOthersDraw(player) {
    for (var i = 0; i < playerList.length; ++i) {
        if (i !== player.number) {
            drawCards(playerList[i], 1)
        }
    }
}

var COPPER = {
    name   : "Copper",
    cost   : 0,
    type   : TREASURE,
    subtype: NONE,
    effect : function(player) {},
    worth  : 1
}

var SILVER = {
    name   : "Silver",
    cost   : 3,
    type   : TREASURE,
    subtype: NONE,
    effect : function(player) {},
    worth  : 2
}

var GOLD = {
    name   : "Gold",
    cost   : 6,
    type   : TREASURE,
    subtype: NONE,
    effect : function(player) {},
    worth  : 3
}

var ESTATE = {
    name   : "Estate",
    cost   : 2,
    type   : VICTORY,
    subtype: NONE,
    effect : function(player) {},
    vp     : function(player) { return 1 }
}

var DUCHY  = {
    name   : "Duchy",
    cost   : 5,
    type   : VICTORY,
    subtype: NONE,
    effect : function(player) {},
    vp     : function(player) { return 3 }
}

var PROVINCE = {
    name   : "Province",
    cost   : 8,
    type   : VICTORY,
    subtype: NONE,
    effect : function(player) {},
    vp     : function(player) { return 5 }
}

var CURSE = {
    name   : "Curse",
    cost   : 0,
    type   : CURSE,
    subtype: NONE,
    effect : function(player) {},
    vp     : -1
}

var VILLAGE = {
    name   : "Village",
    cost   : 3,
    type   : ACTION,
    subtype: NONE,
    effect : function(player) {},
    props  : { actions: 2,
               cards:   1,
               gold:    0,
               buy:     0}
}

var WOODCUTTER = {
    name   : "Woodcutter",
    cost   : 3,
    type   : ACTION,
    subtype: NONE,
    effect : function(player) {},
    props  : { actions: 0,
               cards:   0,
               gold:    2,
               buy:     1}
}

var SMITHY = {
    name   : "Smithy",
    cost   : 4,
    type   : ACTION,
    subtype: NONE,
    effect : function(player) {},
    props  : { actions: 0,
               cards:   3,
               gold:    0,
               buy:     0}
}

var MONEYLENDER = {
    name   : "Money Lender",
    cost   : 4,
    type   : ACTION,
    subtype: NONE,
    effect : function(player) {
        var i = player.hand.indexOf(COPPER)
        if (i >= 0) {
            removeAt(player.hand,i)
            trash.push(COPPER)
            state.gold += 3
        }
    },
    props  : { actions: 0,
               cards:   0,
               gold:    0,
               buy:     0}
} 

var FESTIVAL = {
    name   : "Festival",
    cost   : 5,
    type   : ACTION,
    subtype: NONE,
    effect : function(player) {},
    props  : { actions: 2,
               cards:   0,
               gold:    2,
               buy:     1}
}

var LABORATORY = {
    name   : "Laboratory",
    cost   : 5,
    type   : ACTION,
    subtype: NONE,
    effect : function(player) {},
    props  : { actions: 1,
               cards:   2,
               gold:    0,
               buy:     0}
}

var WITCH = {
    name   : "Witch",
    cost   : 5,
    type   : ACTION,
    subtype: NONE,
    effect : function(player) {
        allOthersGain(player, CURSE)
    },
    props  : { actions: 0,
               cards:   2,
               gold:    0,
               buy:     0}
}

var MARKET = {
    name   : "Market",
    cost   : 5,
    type   : ACTION,
    subtype: NONE,
    effect : function(player) {},
    props  : { actions: 1,
               cards:   1,
               gold:    1,
               buy:     1}
}

var COUNCILROOM = {
    name   : "Council Room",
    cost   : 5,
    type   : ACTION,
    subtype: NONE,
    effect : allOthersDraw,
    props  : { actions: 0,
               cards:   4,
               gold:    0,
               buy:     1}
}

var ADVENTURER = {
    name   : "Adventurer",
    cost   : 6,
    type   : ACTION,
    subtype: NONE,
    effect : function(player) {
        var count = 0
        var revealed = new Array()
        while (count < 2) {
            if (player.deck.length === 0) {
                if (player.discard.length === 0) {
                    break
                } else {
                    player.deck = shuffle(player.discard)
                    clearArray(player.discard)
                }
            }
            var card = player.deck.pop()
            if (card.type === TREASURE) {
                player.hand.push(card)
                count++
            } else {
                revealed.push(card)
            }
        }
        player.discard.concat(revealed)
    },
    props  : { actions: 0,
               cards:   0,
               gold:    0,
               buy:     0}
}

var GARDENS = {
    name   : "Gardens",
    cost   : 4,
    type   : VICTORY,
    subtype: NONE,
    effect : function(player) {},
    vp     : function(player) { return floor (player.deck.length / 10) }     
}

var MINE = {
    name   : "Mine",
    cost   : 5,
    type   : ACTION,
    subtype: NONE,
    effect : function(player) {
        var card = askPlayerForTreasure(player)
        if (card === NULLCARD) {
            return
        } else {
            trash.push(card)
            var gain = askPlayerToGainCard(3 + card.cost, TREASURE)
            gainCard(player, gain)
        }
    },
    props  : { actions: 0,
               cards:   0,
               gold:    0,
               buy:     0}
}
var NULLCARD = 666

var ALLCARDS =[VILLAGE, WOODCUTTER, SMITHY, MONEYLENDER, FESTIVAL,
              LABORATORY, WITCH, MARKET, COUNCILROOM, ADVENTURER, GARDENS]