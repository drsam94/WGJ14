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
    text   : "Worth $1.",
    cost   : 0,
    type   : TREASURE,
    subtype: NONE,
    effect : function(player) {},
    worth  : 1
}

var SILVER = {
    name   : "Silver",
    text   : "Worth $2.",
    cost   : 3,
    type   : TREASURE,
    subtype: NONE,
    effect : function(player) {},
    worth  : 2
}

var GOLD = {
    name   : "Gold",
    text   : "Worth $3.",
    cost   : 6,
    type   : TREASURE,
    subtype: NONE,
    effect : function(player) {},
    worth  : 3
}

var ESTATE = {
    name   : "Estate",
    text   : "Worth 1 Victory Point.",
    cost   : 2,
    type   : VICTORY,
    subtype: NONE,
    effect : function(player) {},
    vp     : function(player) { return 1 }
}

var DUCHY  = {
    name   : "Duchy",
    text   : "Worth 3 Victory Points.",
    cost   : 5,
    type   : VICTORY,
    subtype: NONE,
    effect : function(player) {},
    vp     : function(player) { return 3 }
}

var PROVINCE = {
    name   : "Province",
    text   : "Worth 5 Victory Points.",
    cost   : 8,
    type   : VICTORY,
    subtype: NONE,
    effect : function(player) {},
    vp     : function(player) { return 5 }
}

var CURSE = {
    name   : "Curse",
    text   : "Worth -1 Victory Points.",
    cost   : 0,
    type   : CURSE,
    subtype: NONE,
    effect : function(player) {},
    vp     : -1
}

var VILLAGE = {
    name   : "Village",
    text   : "+1 Card; +2 Actions.",
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
    text   : "+1 Buy; +$2.",
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
    text   : "+3 Cards.",
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
    text   : "Trash a Copper from your hand. If you do, +$3.",
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
    text   : "+2 Actions; +1 Buy; +$2.",
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
    text   : "+2 Cards; +1 Action.",
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
    text   : "+2 Cards; Each other player gains a Curse card.",
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
    text   : "+1 Card; +1 Action; +1 Buy; +$1.",
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
    text   : "+4 Cards; +1 Buy; Each other player draws a card.",
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
    text   : "Reveal cards from your deck until you reveal 2 Treasure cards. Put those Treasure cards in your hand and discard the other revealed cards.",
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
    text   : "Worth 1 Victory Point for every 10 cards in your deck (rounded down).",
    cost   : 4,
    type   : VICTORY,
    subtype: NONE,
    effect : function(player) {},
    vp     : function(player) { return floor (player.deck.length / 10) }     
}

var CELLAR = {
    name   : "Cellar",
    text   : "+1 Action; Discard any number of cards. +1 Card per card discarded",
    cost   : 2,
    type   : ACTION,
    subtype: NONE,
    effect : function(player) {
        askPlayerForCard(player,
            function(card) { return true },
            function(card) { return card === COPPER || card === ESTATE || card === CURSE },
            function(p,c) {
                for (var i = 0; i < c.length; ++i) {
                    p.discard.push(c[i])
                }
                drawCards(p,c.length)
                endAction(player)
            }, 0, Infinity)
    },
    props  : { actions: 1,
               cards:   0,
               gold:    0,
               buy:     0}
}
var MINE = {
    name   : "Mine",
    text   : "Trash a Treasure card from your hand. Gain a Treasure card costing up to $3 more; put it into your hand.",
    cost   : 5,
    type   : ACTION,
    subtype: NONE,
    effect : function(player) {
        if (containsType(player.hand), TREASURE) {
            askPlayerForCard(player, 
                function(card) { return card.type === TREASURE },
                function(card) { return card !== GOLD },
                function(p, c) {
                    c = c[0]
                    if (c === NULLCARD) {
                        return
                    } else {
                        trash.push(c)
                        player.hand.remove(c)
                        askPlayerToGainCard(p, function(cc) {
                            logEvent("chose " + cc.name) 
                            return (cc.cost <= 3 + c.cost) && (cc.type === TREASURE)
                        }, function(pp, cc) {
                                logEvent("chose " + cc.name)
                                if (countInPlay(cc) > 0) {
                                    pp.hand.push(cc)
                                    --cardsInPlay[pileIndex(cc)].count
                                }
                                endAction(player)
                            })
                    }
                }, 1, 1)
        }
    },
    props  : { actions: 0,
               cards:   0,
               gold:    0,
               buy:     0}
}
var NULLCARD = { name: "",
                 text: "",
                 type: NONE }

var ALLPILECARDS =
[VILLAGE, WOODCUTTER, SMITHY, MONEYLENDER, FESTIVAL,
 LABORATORY, WITCH, MARKET, COUNCILROOM, ADVENTURER, 
 GARDENS, MINE, CELLAR]

var ALLCARDS = [ESTATE, DUCHY, PROVINCE, COPPER, SILVER, GOLD,
                CURSE].concat(ALLPILECARDS)