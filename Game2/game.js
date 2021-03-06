/** Fire Emblem X Pokemon
 *  (c) 2014 Sam Donow
 *  The Williams Game Jam 2014 
 */
include('utils.js')
include('utils2.js')
include('sprites.js')
include('unitData.js')

var STATS = { name: 0, Level : 0, Exp   : 0, HP    : 0,
              Strength: 0, Magic: 0, Defense: 0, Skill: 0,
              Speed: 0, Luck: 0, Resistance: 0, Build: 0,
              Movement: 0 }
var LEFT_ARROW  = 37
var UP_ARROW    = 38
var RIGHT_ARROW = 39
var DOWN_ARROW  = 40
var A_KEY       = asciiCode('Z')
var B_KEY       = asciiCode('X')
var X_KEY       = asciiCode('A')
var Y_KEY       = asciiCode('S')

var NORTH = 0
var EAST  = 1
var SOUTH = 2
var WEST  = 3

var SCREEN_TILES_X = 12
var SCREEN_TILES_Y = 12
var TILE_DIMENSION = 16
var ATTACK_TICKER_AMOUNT = 20

var cursorOffscreenX
var cursorOffscreenY

var NOUNIT = 0
var PLAYER = 1
var ENEMY  = 2
var currentTurn
var cursor
var currentMap

/**Gives grand game state, 
 *will eventually include options like unit select*/
var ON_LEVEL = 0
var LOST     = 1
var WON      = 2
var START_SCREEN = 3
var gameState

var allUnits
var alliedUnits
var enemyUnits
var moveDetails
var unitInspection
var endMoveMenu
var attackSquareSelect
var optionsMenu
var animateAttack
var openingBanner
var enemyWait
var itemsMenu

function getDirFromKey(key) {
    return (key - 34) % 4
}
function isArrow(key) {
    return key >= LEFT_ARROW && key <= DOWN_ARROW
}
function tileWidth() {
    return screenWidth / SCREEN_TILES_X
}
function tileHeight() {
    return screenHeight / SCREEN_TILES_Y
}
/**maps map coords to onscreen coords*/
function toRealX(x) {
    return (x - cursorOffscreenX) * tileWidth()
}
function toRealY(y) {
    return (y - cursorOffscreenY) * tileHeight()
}

function drawStartScreen() {
    fillRectangle(0, 0, screenWidth, screenHeight, 'black')
    fillTextWordWrap(screenWidth*3/4, tileHeight()*3/4, 
        'Many years ago, there was something very evil. It was going to destroy the world, but then some cool dudes stopped it. ' +
        'Of course, there were not able to entirely defeat it, they only sealed it away for a very long time. Unfortunately, ' +
        'a very long time has passed, and now some more evil dudes are trying to bring that evil thing back. You are the prince ' +
        'of some nation, and the descendant of one of those people who stopped the evil thing the last time, so now you must fight ' +
        'some people and probably also acquire an object called the Fire Emblem in order to seal that super evil thing again and ' + 
        'save the world. By the way, Z selects units / menu options, etc. X cancels options, and A brings up unit details. Now go ' +
        'play this game that is more engine than game. Press any key to start.',
        screenWidth/8, screenHeight/8, 'white', '60px bold sans-serif', 'left', 'hanging')
}
/** Draws all of the tiles for the map, this is called every frame */
function drawMap() {
    //find offset to where drawing must start
    var xIncrease = cursorOffscreenX
    var yIncrease = cursorOffscreenY
    for (var x = xIncrease; x < xIncrease + SCREEN_TILES_X; ++x) {
        for (var y = yIncrease; y < yIncrease + SCREEN_TILES_Y; ++y) {
            drawImage(currentMap.img, 
                      toRealX(x), toRealY(y),
                      tileWidth(), tileHeight(),
                      currentMap.tile[x][y].x*(1+TILE_DIMENSION)+1, 
                      currentMap.tile[x][y].y*(1+TILE_DIMENSION)+1, 
                      TILE_DIMENSION, TILE_DIMENSION)
        }
    }
}

function drawOptionsMenu() {
    if (optionsMenu.on) {
        for (var i = 0; i < optionsMenu.options.length; ++i) {
            var xloc = screenWidth-tileWidth()*2 + tileWidth() * (i/2)
            var yloc = tileHeight()*2
            fillRectangle(xloc, yloc, 
                tileWidth(), tileHeight()/2, 
                makeColor(.8,.8,.8, i === optionsMenu.selected ? .9 : .5))
            fillText(optionsMenu.options[i],xloc,yloc, 'black', '40px bold sans-serif', 'left', 'hanging')
        }
    }
}

function drawUnitInspection() {
    if (unitInspection.on) {
        var posX
        if (cursor.x - cursorOffscreenX > SCREEN_TILES_X / 2) {
            posX = 0
        } else {
            posX = (SCREEN_TILES_X-2) * tileWidth()
        }
        fillRectangle(posX,0,tileWidth()*2,tileHeight()*7,'grey')
        var i = 1
        for (stat in STATS) {
            var str = ""
            if (stat === "name") {
                str = unitInspection.unit.name
            } else if (stat === "HP") {
                str = "HP: " + unitInspection.unit.currentHP + "/" + unitInspection.unit.HP
            } else {
                str = stat + ": " + unitInspection.unit[stat]
            }
            fillText(str, posX,i++*tileHeight()/2,'black','40px bold sans-serif')
        }
        drawItemsMenu(false)
    }
}

function drawItemsMenu(asMenu) {
    if (!asMenu || itemsMenu.on) {
        var weapons
        var posX
        if (cursor.x - cursorOffscreenX > SCREEN_TILES_X / 2) {
            posX = tileWidth()*2 + tileWidth()/8
        } else {
            posX = (SCREEN_TILES_X-3.5)*tileWidth() - tileWidth()/8
        }
        if (unitInspection.on) {
            weapons = unitInspection.unit.weapons
        } else {
            weapons = moveDetails.unit.weapons
        }
        for (i = 0; i < weapons.length; ++i) {
            fillRectangle(posX,tileHeight()*(i/2),tileWidth()*1.5, tileHeight()/2,
                asMenu? makeColor(.8,.8,.8, (itemsMenu.selected == i ? 1 : .5)) : 'grey')
            fillText(weapons[i].weapon, posX, (i/2)*tileHeight(), 'black', '40px bold sans-serif', 'left','hanging')
            fillText(weapons[i].uses+"", posX+tileWidth()*1.5, (i/2)*tileHeight(), 'black', '40px bold sans-serif', 'right', 'hanging')
        }
    }
}

function drawUnitDetail() {
    var unit
    if ((endMoveMenu.on || optionsMenu.on || 
         attackSquareSelect.on || unitInspection.on
         || animateAttack.on)) {
        return 
    } 
    if (!moveDetails.moving) {
        unit = tileUnderCursor().unit
    } else {
        unit = moveDetails.unit
    }
    if (unit !== NOUNIT) {
       var posX = tileWidth() * (cursor.x - cursorOffscreenX > SCREEN_TILES_X / 2 ? .5 : SCREEN_TILES_X - 2)
       fillRectangle(posX, tileHeight(), 2*tileWidth(), tileHeight(), makeColor(181 / 255, 201 / 255, 199 / 255, .8))
       fillText(unit.name, posX + tileWidth() / 8, tileHeight() * 1.4, 'black', "40px bold sans-serif")
       /** need to actually implement stats eventually */
       fillText("HP:" + unit.currentHP + "/" + unit.HP, posX + tileWidth() / 8, tileHeight() * 1.8, 'black', "40px bold sans-serif")
       fillText("Lv:" + unit.Level, posX + tileWidth() * 10 / 8, tileHeight() * 1.4, 'black', "40px bold sans-serif")
    }
}

function drawCursor() {
    drawImage(cursor.img, 
              (cursor.x - cursorOffscreenX) * screenWidth / SCREEN_TILES_X, 
              (cursor.y - cursorOffscreenY) * screenHeight / SCREEN_TILES_Y,
              screenWidth / SCREEN_TILES_X,
              screenHeight/ SCREEN_TILES_Y)
}

/**Important helper function for below*/
function fillTripleText(field, desc, posX, i, ally, enemy) {
    fillText(ally[field], posX, tileHeight()+tileHeight()*(i/2), 'black', '40px bold sans-serif', 'left', 'hanging')
    fillText(desc, posX+tileWidth(), tileHeight()+tileHeight()*(i/2), 'black', '40px bold sans-serif', 'left', 'hanging')
    fillText(enemy[field], posX+tileWidth()*2, tileHeight()+tileHeight()*(i/2), 'black', '40px bold sans-serif', 'left', 'hanging')
}
function drawCombatDetail() {
    var enemy = 0
    var ally
    if (attackSquareSelect.on) {
        ally = moveDetails.unit
        enemy = attackSquareSelect.options[attackSquareSelect.selected].unit
    } else if (animateAttack.on) {
        ally = animateAttack.attacker
        enemy  = animateAttack.defender
    }
    if (enemy !== 0) {
        var atkData = getAttackData(ally, enemy)
        var defData = getAttackData(enemy, ally)
        var posX = tileWidth() * (cursor.x - cursorOffscreenX > SCREEN_TILES_X / 2 ? .5 : SCREEN_TILES_X - 3)
        fillRectangle(posX, tileHeight(), tileWidth(), tileHeight()*3, ally.army === "ally" ? 'blue' : 'red')
        fillRectangle(posX+tileWidth(), tileHeight(), tileWidth(), tileHeight()*3,'grey')
        fillRectangle(posX+tileWidth()*2, tileHeight(), tileWidth(), tileHeight()*3, enemy.army === "ally" ? 'blue' : 'red')
        fillTripleText("name", "Name", posX, 0, ally, enemy)
        fillTripleText("currentHP", "HP", posX, 1, ally, enemy)
        fillTripleText("Might", "Mt", posX, 2, atkData, defData)
        fillTripleText("numAttacks", "x", posX, 3, atkData, defData)
        fillTripleText("Accuracy", "Hit", posX, 4, atkData, defData)
        fillTripleText("Crit", "Crit", posX, 5, atkData, defData)
    }
    if (attackSquareSelect.on) {
        fillRectangle(posX+tileWidth()/2, tileHeight()*4, tileWidth()*2, tileHeight()/2, 'grey')
        fillText("<A " + ally.weapons[0].weapon + " S>", posX + tileWidth()/2, tileHeight()*4, 'black', '40px bold sans-serif', 'left', 'hanging')
    }
}

function drawHPBar(unit, posX, posY) {
    fillRectangle(posX, posY, 2 * tileWidth(), .5 * tileHeight(), unit.army === 'ally' ? 'blue' : 'red')
    fillText(unit.currentHP, posX, posY, 'black', '40px bold sans-serif', 'left', 'hanging')
    fillRectangle(posX+tileWidth()*.5, posY, 1.5 * tileWidth() * unit.HP / 80, .5*tileHeight(), 'grey')
    fillRectangle(posX+tileWidth()*.5, posY, 1.5 * tileWidth() * unit.currentHP / 80, .5*tileHeight(), 'yellow')
}

function drawMidCombatDetail() {
    if (animateAttack.on) {
        var posY = tileWidth() * animateAttack.attacker.y + 
        3 * (animateAttack.attacker.y - cursorOffscreenY > SCREEN_TILES_Y / 2 ? -1 : 1)
        if (animateAttack.attacker.x <= animateAttack.defender.x) {
            var posX = min(animateAttack.attacker.x - cursorOffscreenX, SCREEN_TILES_X - 4)
            drawHPBar(animateAttack.attacker, posX, posY)
            drawHPBar(animateAttack.defender,posX + 2*tileWidth(), posY)
        } else {
            var posX = min(animateAttack.defender.x - cursorOffscreenX, SCREEN_TILES_X - 4)
            drawHPBar(animateAttack.defender, posX, posY)
            drawHPBar(animateAttack.attacker,posX + 2*tileWidth(), posY)
        }
    }
}

/** draws colored tiles, etc to help with moving */
function drawMoveDetails() {
    if (moveDetails.moving) {
        if (moveDetails.validSquares.length === 0) {
            computeValidMoveSquares()
        }
        for (var i = 0; i < moveDetails.validSquares.length; ++i) {
            var drawX = toRealX(moveDetails.validSquares[i].x) 
            var drawY = toRealY(moveDetails.validSquares[i].y)
            if (drawX >= 0 && drawX <= SCREEN_TILES_X * tileWidth() &&
                drawY >= 0 && drawY <= SCREEN_TILES_Y * tileHeight()) {
                fillRectangle(drawX, drawY, tileWidth(), tileHeight(), makeColor(87 / 255, 221 / 255, 208 / 255, .5))
            }
        }
    }
}

function drawEndMoveMenu() {
    if (endMoveMenu.on) {
        if (endMoveMenu.options.length === 0) {
            if (adjacentToEnemy(endMoveMenu.unit)) {
                endMoveMenu.options.push("Attack")
            }
            endMoveMenu.options.push("Items")
            endMoveMenu.options.push("Wait")
            endMoveMenu.selected = 0
        }
        var startX
        var unit = endMoveMenu.unit
        if (unit.x - cursorOffscreenX < SCREEN_TILES_X - 1) {
            startX = toRealX(unit.x+1)
        } else {
            startX = toRealX(unit.x-1)
        }
        var startY = min(screenHeight - (endMoveMenu.options.length * tileHeight() / 2), toRealY(unit.y))
        for (var i = 0; i < endMoveMenu.options.length; ++i) {
            fillRectangle(startX, startY + tileHeight() / 2 * i, tileWidth(), tileHeight() / 2, 
                i === endMoveMenu.selected ? makeColor(.8,.8,.8,.9) : makeColor(.8,.8,.8,.5))
            fillText(endMoveMenu.options[i], startX, startY + i*(tileHeight() / 2), 'black', '24px bold sans-serif', 'left', 'hanging')    
        }
    }
}

function drawArmy(army) {
    for (var i = 0; i < army.length; ++i) {
        var unit = army[i]
        drawImage(spriteData[unit.class].sheet[unit.army],
                  toRealX(unit.x), toRealY(unit.y),
                  tileWidth(), tileHeight(),
                  spriteData[unit.class].start + spriteData[unit.class].width[(floor(currentTime()*3) % 3)],31, TILE_DIMENSION, TILE_DIMENSION) 
        if (!unit.active) {
            fillRectangle(toRealX(unit.x), toRealY(unit.y),
                          tileWidth(), tileHeight(),
                          makeColor(0,0,0,.7))
        }
    }
}

function drawUnits() {
    drawArmy(alliedUnits)
    drawArmy(enemyUnits)
}

function drawOpeningBanner() {
    if (openingBanner.on) {
        fillRectangle(screenWidth/2 - tileWidth(), screenHeight/2 - tileHeight(), 
            tileWidth() * 2, tileHeight(), currentTurn === PLAYER ? 'blue' : 'red')
        fillText((currentTurn === PLAYER ? "Player" : "Enemy") + "Turn",
            screenWidth/2 - tileWidth(), screenHeight/2 - tileHeight(),
            'black', '50px bold sans-serif', 'left', 'hanging')
    }
}

function drawLoseScreen() {
    fillRectangle(0,0,screenWidth, screenHeight, 'red')
    fillText("Jaffar died. You lose.", screenWidth/2, screenHeight/2, 'white', '60px bold sans-serif')
}

function drawWinScreen() {
    fillRectangle(0,0,screenWidth, screenHeight, 'black')
    fillText("You killed the enemy. You win!", screenWidth/2, screenHeight/2, 'white', '60px bold sans-serif')
}

function computeValidMoveSquares() {
    var moveAmount = moveDetails.unit.Movement//moveDetails.unit.move (eventually once more complex units exist, this will be real
    var moveCosts = makeArray(moveAmount*2+1, moveAmount*2+1)
    for (var i = 0; i < moveCosts.length; ++i) {
        for (var j = 0; j < moveCosts[i].length; ++j) {
            moveCosts[i][j] = Infinity
        }
    }
    moveCosts[0][0] = 0;
    moveDetails.validSquares.push(moveDetails.loc)
    var changed
    do {
        changed = false
        for (var r = 1; r <= moveAmount; ++r) {
            for (var x = -r; x <= r; ++x) {
                for (var ySwitch = 0; ySwitch < 2; ++ySwitch) {
                    var y = r - abs(x)
                    y *= ySwitch === 0 ?  -1 : 1
                    var mapX = moveDetails.loc.x + x
                    var mapY = moveDetails.loc.y + y
                    if (mapX >= 0 && mapX < currentMap.width  &&
                        mapY >= 0 && mapY < currentMap.height &&
                        (currentMap.tile[mapX][mapY].unit === NOUNIT ||
                        currentMap.tile[mapX][mapY].unit.army === moveDetails.unit.army)) {
                        var fromPossibilities = getNeighbors({ x: mapX, y: mapY})
                        var minMoveCost = Infinity
                        for (var i = 0; i < fromPossibilities.length; ++i) {
                            var dX = x + fromPossibilities[i].xOffset
                            var dY = y + fromPossibilities[i].yOffset
                            var mcX  = abs(dX) + (dX < 0 ? moveAmount : 0)
                            var mcY  = abs(dY) + (dY < 0 ? moveAmount : 0)
                            if (dX >= -moveAmount && dX <= moveAmount &&
                                dY >= -moveAmount && dY <= moveAmount) {
                                minMoveCost = min(minMoveCost, moveCosts[mcX][mcY])
                            }
                        }
                        var mcX = abs(x) + (x < 0 ? moveAmount : 0)
                        var mcY = abs(y) + (y < 0 ? moveAmount : 0)
                        var currentCost = minMoveCost + terrainData[currentMap.tile[mapX][mapY].type].cost
                        if (currentCost < moveCosts[mcX][mcY]) {
                            moveCosts[mcX][mcY] = currentCost
                            changed = true
                            if(currentCost <= moveAmount && currentMap.tile[mapX][mapY].unit === NOUNIT) {
                                moveDetails.validSquares.setAdd({ x: mapX, y: mapY})
                            }
                        }
                    }
                }
            }
        } 
    } while(changed)
}

function getAttackData(attacker, defender) {
    var attackerData = new Object()
    var attackWeapon = weaponData[attacker.weapons[0].weapon]
    var defendWeapon = weaponData[defender.weapons[0].weapon]
    if (attackWeapon.DamageType === "Physical") {
        attackerData.Might = attacker.Strength + attackWeapon.Might * 1 - 
                             defender.Defense
    } else {
        attackerData.Might = attacker.Magic + attackWeapon.Might * 1 - 
                             defender.Resistance
    }

    var defTerrainData = terrainData[currentMap.tile[defender.x][defender.y].type]
    attackerData.Accuracy = clamp(attacker.Skill * 2 + attackWeapon.Hit -
                            (defender.Speed + defender.Luck +  defTerrainData.Avoid), 0, 100)
    attackerData.Might -= defTerrainData.Def
    attackerData.Crit  = clamp(attackWeapon.Crit + attacker.Skill - defender.Skill, 0, 100)
    if (attacker.Speed - attackWeapon.Weight - 
       (defender.Speed - defendWeapon.Weight) >= 3) {
        attackerData.numAttacks = 2
    } else {
        attackerData.numAttacks = 1
    }
    return attackerData
}

function percentChance(percent) {
    return (randomReal(0,100) < percent)
}

function hitChance(percent) {
    return (randomReal(0,100) + randomReal(0,100)) / 2 < percent
}

/** Applies an attack, then returns if lethal */
function applyAttackData(attacker, defender, attackerData, defenderData) {
    attackerData.numAttacks--
    if (hitChance(attackerData.Accuracy)) {
        if (percentChance(attackerData.Crit)) {
            attackerData.Might *= 3
        }
        animateAttack.damageToDeal = attackerData.Might
        attacker.weapons[0].uses--
    }
}

function applyExperience(gainer, other, otherStartHP) {
    if (gainer.currentHP === 0) { return }
    if (other.currentHP === 0) {
        return addExp(gainer, 30 + (other.Level - gainer.Level) * 2)
    } else if (otherStartHP > other.currentHP) {
        return addExp(gainer, 10 + (other.Level - gainer.Level))
    } else {
        return addExp(gainer, 1)
    }
}

function performAttack(attacker, defender, nextIndex) {
    attackSquareSelect.on = false
    animateAttack = { on: true,
    beginAttackHP : attacker.currentHP,
    beginDefHP    : defender.currentHP,
    attackerData : getAttackData(attacker, defender),
    defenderData : getAttackData(defender, attacker),
    attacker     : attacker,
    defender     : defender,
    turn         : 0,
    ticker       : ATTACK_TICKER_AMOUNT,
    nextIndex    : nextIndex,
    damageToDeal : 0,
    endNextTick  : false }
}

function checkAndHandleDeath(unit) {
    if (unit.currentHP <= 0) {
        if (unit.name === "Jaffar") {
            gameState = LOST
            return
        }
        allUnits[unit.army].remove(unit)
        currentMap.tile[unit.x][unit.y].unit = NOUNIT
        animateAttack.damageToDeal = 0
        animateAttack.nextIndex--
        animateAttack.endNextTick = true
        animateAttack.ticker = ATTACK_TICKER_AMOUNT
        if (enemyUnits.length === 0) {
            gameState = WON
        }
    }
}

function animateDamage(unit) {
    --unit.currentHP
    --animateAttack.damageToDeal
    --animateAttack.ticker
}

function slowApplyAttack() {
    if (!animateAttack.on) { return }
    if (animateAttack.damageToDeal > 0) {
        var unit = animateAttack.turn === 0 ? animateAttack.defender : animateAttack.attacker
        animateDamage(unit)
        checkAndHandleDeath(unit)
    } else if (animateAttack.endNextTick) {
        if (--animateAttack.ticker <= 0) {
            endAttack()
        }
    } else if (animateAttack.attackerData.numAttacks + animateAttack.defenderData.numAttacks > 0) {
        if (--animateAttack.ticker <= 0) {
            if (animateAttack.turn === 0 && animateAttack.attackerData.numAttacks > 0) {
                applyAttackData(animateAttack.attacker, animateAttack.defender,
                                    animateAttack.attackerData, animateAttack.defenderData)
                animateAttack.ticker = ATTACK_TICKER_AMOUNT
            } else if (animateAttack.turn === 1 && animateAttack.defenderData.numAttacks > 0) {
                applyAttackData(animateAttack.defender, animateAttack.attacker,
                                animateAttack.defenderData, animateAttack.attackerData)
                animateAttack.ticker = ATTACK_TICKER_AMOUNT
            } else {
                animateAttack.turn += 1
                animateAttack.turn %= 2
            }
        } 
    } else {
        animateAttack.endNextTick = true
        animateAttack.ticker = ATTACK_TICKER_AMOUNT
    }
}

function endAttack() {
    if (animateAttack.attacker.army === "ally") {
        applyExperience(animateAttack.attacker, animateAttack.defender, animateAttack.beginDefHP)
    } else if (animateAttack.defender.army === "ally") {
        applyExperience(animateAttack.defender, animateAttack.attacker, animateAttack.beginAttackHP)
    }
    animateAttack.attacker.active = false
    animateAttack.on = false
    if (animateAttack.nextIndex >= 0) {
        doEnemyTurn(animateAttack.nextIndex)
    }
}


function performMenuSelection(menu) {
    var selection = menu.options[menu.selected]
    if (selection === "Wait") {
        menu.unit.active = false
    } else if (selection === "Attack") {
        attackSquareSelect.on = true
        attackSquareSelect.options  = getNeighborsWithEnemies(endMoveMenu.unit)
        attackSquareSelect.selected = 0
        var unit = attackSquareSelect.options[attackSquareSelect.selected].unit
        moveCursorTo(unit.x, unit.y)
    } else if (selection === "End") {
        beginEnemyTurn()
    } else if (selection === "Items") {
        itemsMenu = { on: true, selected: 0}
    }
    menu.on = false
}

function getNeighbors(unit) {
    var ret = new Array()
    if (unit.x > 0) {
        ret.push({ tile: currentMap.tile[unit.x-1][unit.y], xOffset: -1, yOffset: 0 })
    }
    if (unit.y > 0) {
        ret.push({ tile: currentMap.tile[unit.x][unit.y-1], xOffset: 0, yOffset: -1})
    }
    if (unit.x < currentMap.width - 1) {
        ret.push({ tile: currentMap.tile[unit.x+1][unit.y], xOffset: 1, yOffset: 0})
    }
    if (unit.y < currentMap.height - 1) {
        ret.push({ tile: currentMap.tile[unit.x][unit.y+1], xOffset: 0, yOffset: 1})
    }
    return ret
}

function getNeighborsWithEnemies(unit) {
    var neighbors = getNeighbors(unit)
    for (var i = neighbors.length - 1; i >= 0; --i) {
        if (!(neighbors[i].tile.unit !== NOUNIT && 
              neighbors[i].tile.unit.army !== unit.army)) {
            neighbors.removeAt(i)
        } else {
            neighbors[i] = neighbors[i].tile
        }
    }
    return neighbors
}

function adjacentToEnemy(unit) {
    return getNeighborsWithEnemies(unit).length > 0
}

/** given a map json and a tileset, loads a map */
function loadMap(mapFileName, imageFileName) {
    var mapjson = JSON.parse(getRemoteFileAsString(mapFileName))
    enemyUnits  = mapjson.enemies
    var stringRep = getRemoteFileAsString(mapjson.terrain)
    var ret = new Object()
    ret.img = loadImage(imageFileName)
    ret.tile = new Array()
    var x = 0
    var y = 0
    var maxY = 0
    var maxX = 0
    for (var i = 0; i < stringRep.length; ++i) {
        maxX = max(x, maxX)
        maxY = max(y, maxY)
        if (ret.tile.length <= x) {
            ret.tile.push(new Array())
        }
        if (stringRep.charAt(i) === '\n') {
            ++y
            x = 0
        } else {
            ret.tile[x].push(cloneObject(AsciiToTileXY[stringRep.charAt(i)]))
            ret.tile[x][y].unit = NOUNIT
            ++x
        }
    }
    for (var i = 0; i < alliedUnits.length; ++i) {
        for (var x in mapjson.allies[i]) {
            alliedUnits[i][x] = mapjson.allies[i][x]
        }
        ret.tile[alliedUnits[i].x][alliedUnits[i].y].unit = alliedUnits[i]
    }
    for (var i = 0; i < enemyUnits.length; ++i) {
        var unit = enemyUnits[i]
        for (var x in classData[unit.class].base) {
            unit[x] = classData[unit.class].base[x]
        }
        for (var j = 1; j < unit.Level; ++j) {
            applyGrowth(unit, classData[unit.class].growth)
        }
        ret.tile[unit.x][unit.y].unit = unit
        unit.currentHP = unit.HP
        unit.Exp = 0
        unit.weaponLevel = classData[unit.class].weaponLevel
        for (var w = 0; w  < unit.weapons.length; ++w) {
            unit.weapons[w] = {weapon: unit.weapons[w], uses: weaponData[unit.weapons[w]].Uses}
        }
    }
    ret.width  = maxX
    ret.height = maxY + 1
    return ret
}

function addExp(unit, amount) {
    amount = clamp(amount, 1, 100)
    unit.Exp += amount
    if (unit.Exp >= 100) {
        unit.Exp -= 100
        unit.Level++
        applyGrowth(unit, characterData[unit.name].growth)
    }
}
function applyGrowth(unit, growth) {
    for (var x in growth) {
        if (randomReal(0,100) < growth[x]) {
            unit[x]++
        }
    }
}

function moveCursorTo(x, y) {
    cursor.x = x
    cursor.y = y
    while (cursor.y < cursorOffscreenY) { 
        --cursorOffscreenY 
    }
    while (cursor.x - cursorOffscreenX >= SCREEN_TILES_X) { 
        ++cursorOffscreenX 
    }
    while (cursor.y - cursorOffscreenY >= SCREEN_TILES_Y) { 
        ++cursorOffscreenY 
    }
    while (cursor.x < cursorOffscreenX) { 
        --cursorOffscreenX 
    }
}

function moveCursorOne() {
    switch(cursor.dir) {
        case NORTH:
            if (cursor.y > 0) { 
                moveCursorTo(cursor.x, cursor.y-1)
            }
            break
        case EAST:
            if (cursor.x < currentMap.width - 1) { 
                moveCursorTo(cursor.x+1, cursor.y)
            }
            break
        case SOUTH:
            if (cursor.y < currentMap.height - 1) { 
                moveCursorTo(cursor.x, cursor.y+1) 
            }
            break
        case WEST:
            if (cursor.x > 0) { 
                moveCursorTo(cursor.x-1, cursor.y)
            }
            break
    }
}

function updateCursor() {
    if (cursor.moving && currentTime() - cursor.lastPressTime > .15) {
        cursor.lastPressTime = currentTime()
        moveCursorOne()
    }
}

function onKeyEnd(key) {
    if (cursor.moving && cursor.dir === getDirFromKey(key)) {
        cursor.moving = false
    }
}

function isValidMoveSquare(square) {
    for (var i = 0; i < moveDetails.validSquares.length; ++i) {
        if (square.x === moveDetails.validSquares[i].x &&
            square.y === moveDetails.validSquares[i].y) {
            return true
        }
    }
    return false
}

function tileUnderCursor() {
    return currentMap.tile[cursor.x][cursor.y]
}

function handleMenuKey(key, menu, cancelFunc) {
    if (key === UP_ARROW) {
        menu.selected -= 1
        menu.selected += menu.options.length
        menu.selected %= menu.options.length
    } else if (key === DOWN_ARROW) {
        menu.selected += 1
        menu.selected %= menu.options.length
    } else if (key === B_KEY) {
        cancelFunc()
        menu.on = false
    } else if (key === A_KEY) {
        performMenuSelection(menu)
    }
}

function canWieldWeapon(unit, weapon) {
    var wStats = weaponData[weapon.weapon]
    return isWeapon(weapon) && wStats.Level <= unit.weaponLevel[wStats.Type]
}

function isWeapon(weapon) {
    for (w in weaponData) {
        if (w === weapon.weapon) {
            return true
        }
    }
    return false
}
function onKeyStart(key) {
    if (gameState === START_SCREEN) {
        gameState = ON_LEVEL
    } else if (gameState !== ON_LEVEL) {
        onSetup()
    } else if (gameState === ON_LEVEL && currentTurn === PLAYER && !openingBanner.on && !animateAttack.on) {
        if (unitInspection.on) {
            if (key === B_KEY) {
                unitInspection.on = false
            }
        } else if (itemsMenu.on) {
            if (key === B_KEY) {
                itemsMenu.on   = false
                endMoveMenu.on = true
            } else if (key === A_KEY) {
                if (isWeapon(moveDetails.unit.weapons[itemsMenu.selected])) {
                    var temp = moveDetails.unit.weapons[0]
                    moveDetails.unit.weapons[0] = moveDetails.unit.weapons[itemsMenu.selected]
                    moveDetails.unit.weapons[itemsMenu.selected] = temp
                    itemsMenu.on = false
                    endMoveMenu.on = true
                } else {
                    useItem(moveDetails.unit, itemsMenu.selected)
                }
            } else if (key === UP_ARROW) {
                --itemsMenu.selected
                itemsMenu.selected += moveDetails.unit.weapons.length
                itemsMenu.selected %= moveDetails.unit.weapons.length
            } else if (key === DOWN_ARROW) {
                ++itemsMenu.selected
                itemsMenu.selected %= moveDetails.unit.weapons.length
            }
        } else if (endMoveMenu.on) {
            handleMenuKey(key, endMoveMenu, 
                function() {moveUnitTo(moveDetails.unit, moveDetails.loc.x, moveDetails.loc.y)})
        } else if (optionsMenu.on) {
            handleMenuKey(key, optionsMenu, function() {})
        } else if (attackSquareSelect.on) {
            if (key === RIGHT_ARROW || key === DOWN_ARROW) {
                attackSquareSelect.selected += 1
                attackSquareSelect.selected %= attackSquareSelect.options.length
                var square = attackSquareSelect.options[attackSquareSelect.selected].unit
                moveCursorTo(square.x, square.y)
            } else if (key === LEFT_ARROW|| key === UP_ARROW) {
                attackSquareSelect.selected -= 1
                attackSquareSelect.selected += attackSquareSelect.options.length
                attackSquareSelect.selected %= attackSquareSelect.options.length
                var square = attackSquareSelect.options[attackSquareSelect.selected].unit
                moveCursorTo(square.x, square.y)
            } else if (key === B_KEY) {
                endMoveMenu.on = true
                attackSquareSelect.on = false
                cursor.x = moveDetails.unit.x
                cursor.y = moveDetails.unit.y
            } else if (key === A_KEY) {
                performAttack(endMoveMenu.unit, attackSquareSelect.options[attackSquareSelect.selected].unit, -1)
            } else if (key === X_KEY) {
                do {
                    if (moveDetails.unit.weapons.length > 1) {
                        var weapons = moveDetails.unit.weapons
                        var newWeapons = new Array()
                        newWeapons.push(weapons[weapons.length-1])
                        for (var i = 0; i < weapons.length-1; ++i) {
                            newWeapons.push(weapons[i])
                        }
                        moveDetails.unit.weapons = newWeapons
                    }
                } while (!canWieldWeapon(moveDetails.unit, moveDetails.unit.weapons[0]))

            } else if (key === Y_KEY) {
                do {
                    if (moveDetails.unit.weapons.length > 1) {
                        var weapons = moveDetails.unit.weapons
                        var newWeapons = new Array()
                        newWeapons.push(weapons[1])
                        for (var i = 2; i < weapons.length; ++i) {
                            newWeapons.push(weapons[i])
                        }
                        newWeapons.push(weapons[0])
                        moveDetails.unit.weapons = newWeapons
                    }
                } while (!canWieldWeapon(moveDetails.unit, moveDetails.unit.weapons[0]))
            }
        } else {
            if (isArrow(key)) {
                cursor.dir = getDirFromKey(key)
                cursor.lastPressTime = currentTime()
                cursor.moving = true
                moveCursorOne()
            }
            if (key === A_KEY) {
                if (!moveDetails.moving) {
                    if (tileUnderCursor().unit !== NOUNIT &&
                        (tileUnderCursor().unit.army !== "ally" ||
                         tileUnderCursor().unit.active)) {
                        moveDetails.moving = true
                        moveDetails.validSquares = []
                        moveDetails.loc = { x: cursor.x, y: cursor.y }
                        moveDetails.unit = tileUnderCursor().unit
                    } else {
                        optionsMenu = {on: true, options: [ "End" ], selected: 0 }
                    }
                } else {
                    if (moveDetails.unit.army === "ally" && isValidMoveSquare(cursor)) {
                        /** Will have to do walking animation, but of all the things to cut corners on, this is it */
                        moveUnitTo(moveDetails.unit, cursor.x, cursor.y)
                        endMoveMenu = { on : true, selected : 0, options : [], unit : moveDetails.unit}
                    }
                    moveDetails.moving = false
                    moveDetails.validSquares = []
                }
            }
            if (key === B_KEY && moveDetails.moving) {
                moveDetails = {moving: false}
            }
            if (key === X_KEY && !moveDetails.moving) {
                if (tileUnderCursor().unit !== NOUNIT) {
                    unitInspection = { on : true, unit : tileUnderCursor().unit }
                }
            }
        }
    }
}

function moveUnitTo(unit, x, y) {
    var oldX = unit.x
    var oldY = unit.y
    unit.x = x
    unit.y = y
    currentMap.tile[oldX][oldY].unit = NOUNIT
    currentMap.tile[x][y].unit = unit
}

function setUpAllies() {
    for (var i = 0; i < alliedUnits.length; ++i) {
        var unit = alliedUnits[i]
        /** if (unitAlreadyExists) { get from player data */
        //else
        for (var x in characterData[unit.name].base) {
            unit[x] = characterData[unit.name].base[x] + classData[unit.class].base[x]
        }
        unit.currentHP = unit.HP
        unit.army = "ally"
        unit.active = true
    }
}

function beginPlayerTurn() {
    openingBanner = {on: true, ticker: 30, callback: function() {}}
    alliedUnits.forEach(function(x) {x.active = true})
    enemyUnits.forEach(function(x) {x.active = true})
    currentTurn = PLAYER
    moveDetails = { moving: false, validSquares: []}
    for (var i = 0; i < alliedUnits.length; ++i) {
        if (alliedUnits[i].name === "Jaffar") {
            moveCursorTo(alliedUnits[i].x, alliedUnits[i].y)
            break
        }
    }
}

function noActiveAllies() {
    for (var i = 0; i < alliedUnits.length; ++i) {
        if (alliedUnits[i].active) {
            return false
        }
    }
    return true
}

function useItem(unit, index) {
    itemsData[unit.weapons[index].weapon].Effect(unit)
    unit.active = false
    itemsMenu.on = false
    if (--unit.weapons[index].uses === 0) {
        unit.weapons.removeAt(index)
    }
}
function strengthMetric(unit) {
    return unit.Defense
}

function beginEnemyTurn() {
    currentTurn = ENEMY
    alliedUnits.forEach(function(x) {x.active = true})
    enemyUnits.forEach(function(x) {x.active = true})
    openingBanner = {on: true, ticker: 30, callback : function() {doEnemyTurn(0)}}
}

function handleEnemyWait() {
    if (enemyWait.on) {
        if (--enemyWait.ticker <= 0) {
            enemyWait.on = false
            doEnemyTurn(enemyWait.nextIndex)
        }
    }
}

function doEnemyTurn(startIndex) {
    if (startIndex === 0) {
        enemyUnits.forEach(function(x) { x.active = true})
        alliedUnits.sortBasedOnMetric(strengthMetric)
    } else {
        enemyUnits[startIndex-1].active = false
    }
    var e = startIndex
    if (e < enemyUnits.length) {
        var unit = enemyUnits[e]
        moveDetails = { moving: true, validSquares: [], unit: unit, loc: {x: unit.x, y: unit.y}}
        computeValidMoveSquares()
        /** Sort allies based on weakness metric...*/
        for (var a = 0; a < alliedUnits.length; ++a) {
            var attackSquares = getNeighbors(alliedUnits[a])
            attackSquares.sortBasedOnMetric(function(x) { return terrainData[x.tile.type].Avoid})
            for (var s = attackSquares.length - 1; s >= 0; --s) {
                var targetSquare = {x: attackSquares[s].xOffset + alliedUnits[a].x, y: attackSquares[s].yOffset + alliedUnits[a].y}
                if (moveDetails.validSquares.containsXY(targetSquare)) {
                    moveUnitTo(unit, targetSquare.x, targetSquare.y)
                    moveCursorTo(targetSquare.x, targetSquare.y)
                    performAttack(unit, alliedUnits[a], startIndex + 1)
                    return 
                }
            }
        }
        // If we can't attack, then move close to a unit
        // again, will get that weakness metric
        var dX = unit.x - alliedUnits[0].x
        var dY = unit.y - alliedUnits[0].y
        var targetSquare = moveDetails.validSquares.getMinBasedOnMetric(
            abs(dX) > abs(dY) ? function(o) { return sign(dX) *(o.x)} :
                                function(o) { return sign(dY) *(o.y)})
        moveUnitTo(unit, targetSquare.x, targetSquare.y)
        enemyWait = {on: true, ticker: ATTACK_TICKER_AMOUNT, nextIndex: startIndex+1}
        return
    } else {
        beginPlayerTurn()
    }
}

function onSetup() {
    cursorOffscreenX = 0 
    cursorOffscreenY = 0
    endMoveMenu = { on : false, selected : 0, options : [], unit : NOUNIT}
    gameState = START_SCREEN
    /** This could eventually be loaded from some more complex stuff */
    alliedUnits =  [ { name : "Jaffar", class : "Assassin", Level : 1, weapons : [ {weapon: "Iron Sword", uses: 50}, {weapon: "Steel Sword", uses: 35}, {weapon: "Vulnerary", uses: 3}], Exp: 0, weaponLevel : {Sword : 3} },
                     { name : "Marth", class : "Assassin", Level : 2, weapons : [ {weapon: "Iron Sword", uses: 50}, {weapon: "Steel Sword", uses: 35}, {weapon: "Vulnerary", uses: 3}], Exp: 0, weaponLevel : {Sword : 1} },
                     { name : "Eliwood", class : "Assassin", Level : 3, weapons : [{weapon: "Iron Sword", uses: 50}, {weapon: "Vulnerary", uses: 3}], Exp: 0, weaponLevel : {Sword : 3} }]
    setUpAllies()
    cursor  = { img: loadImage('Cursor.png'), x: 0, y: 0, lastPressTime : currentTime()}
    currentMap = loadMap('map1.json', 'TileSet.png')
    moveDetails = { moving: false, validSquares : [] }
    attackSquareSelect = { on: false, options : [], selected: 0}
    allUnits = { "ally" : alliedUnits, "enemy" : enemyUnits}
    unitInspection = {on: false}
    optionsMenu    = {on: false}
    animateAttack  = {on: false}
    enemyWait      = {on: false}
    itemsMenu      = {on: false}
    beginPlayerTurn()
}

function onTick() {
    var beginTime = currentTime()
    if (gameState === ON_LEVEL) {
        drawMap()
        if (currentTurn === PLAYER) {
            drawMoveDetails()
        }
        drawUnits()
        drawCombatDetail()
        if (openingBanner.on) {
            drawOpeningBanner()
            if (--openingBanner.ticker <= 0) {
                openingBanner.on = false
                openingBanner.callback()
            }
        } else if (currentTurn === PLAYER) {
            drawUnitDetail()
            drawEndMoveMenu()
            drawCursor()
            drawItemsMenu(true)
            drawUnitInspection()
            drawOptionsMenu()
            updateCursor()
        } else if (currentTurn === ENEMY && !openingBanner.on) {
            handleEnemyWait()
        }
        if (animateAttack.on) {
            slowApplyAttack()
            drawMidCombatDetail()
        }
        if (noActiveAllies() && currentTurn === PLAYER) {
            beginEnemyTurn()
        }
    } else if (gameState === LOST) {
        drawLoseScreen()
    } else if (gameState === WON) {
        drawWinScreen()
    } else if (gameState === START_SCREEN) {
        drawStartScreen()
    }
    var endTime = currentTime()
    fillText( min(30, floor(1 / (endTime - beginTime))) + "fps", 50,screenHeight-50,'black', 'bold 40px sans-serif')
}