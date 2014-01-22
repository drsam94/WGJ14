/** Fire Emblem X Pokemon
 *  (c) 2014 Sam Donow
 *  The Williams Game Jam 2014 
 */
include('utils2.js')
include('sprites.js')
include('unitData.js')

var LEFT_ARROW  = 37
var UP_ARROW    = 38
var RIGHT_ARROW = 39
var DOWN_ARROW  = 40
var B_KEY       = asciiCode('Z')
var A_KEY       = asciiCode('X')

var NORTH = 0
var EAST  = 1
var SOUTH = 2
var WEST  = 3

var SCREEN_TILES_X = 10
var SCREEN_TILES_Y = 10
var TILE_DIMENSION = 16

var cursorOffscreenX
var cursorOffscreenY

var NOUNIT = 0
var onLevel
var cursor
var currentMap

var alliedUnits
var enemyUnits
var moveDetails
var endMoveMenu
var attackSquareSelect


function cloneObject(obj) {
    var o2 = new Object()
    for (x in obj) {
        o2[x] = obj[x]
    }
    return o2
}

function getDirFromKey(key) {
    return (key - 34) % 4
}

function isArrow(key) {
    return key >= LEFT_ARROW && key <= DOWN_ARROW
}

function L1Norm(o1, o2) {
    return abs(o1.x - o2.x) + abs(o1.y - o2.y)
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

function toRealX(x) {
    return (x - cursorOffscreenX) * tileWidth()
}

function toRealY(y) {
    return (y - cursorOffscreenY) * tileHeight()
}

function drawUnitDetail() {
    var unit
    if (!moveDetails.moving) {
        unit = currentMap.tile[cursor.x][cursor.y].unit
    } else {
        unit = moveDetails.unit
    }
    if (unit !== NOUNIT) {
       var posX = tileWidth() * (cursor.x - cursorOffscreenX > SCREEN_TILES_X / 2 ? .5 : SCREEN_TILES_X - 2.5)
       fillRectangle(posX, tileHeight(), 2*tileWidth(), tileHeight(), makeColor(181 / 255, 201 / 255, 199 / 255, .8))
       fillText(unit.name, posX + tileWidth() / 8, tileHeight() * 1.4, 'black', "40px bold sans-serif")
       /** need to actually implement stats eventually */
       fillText("HP:" + unit.currentHP + "/" + unit.HP, posX + tileWidth() / 8, tileHeight() * 1.8, 'black', "40px bold sans-serif")
    }
}

function tileWidth() {
    return screenWidth / SCREEN_TILES_X
}

function tileHeight() {
    return screenHeight / SCREEN_TILES_Y
}

function drawUnits() {
    for (var i = 0; i < alliedUnits.length; ++i) {
        var unit = alliedUnits[i]
        drawImage(classNameToSpriteSheet[unit.class][unit.army],
                  toRealX(unit.x), toRealY(unit.y),
                  tileWidth(), tileHeight(),
                  5 + 20*(floor(currentTime()*3) % 3),30, TILE_DIMENSION, TILE_DIMENSION) 
        if (!unit.active) {
            fillRectangle(toRealX(unit.x), toRealY(unit.y),
                          tileWidth(), tileHeight(),
                          makeColor(0,0,0,.7))
        }
    }
    for (var i = 0; i < enemyUnits.length; ++i) {
        var unit = enemyUnits[i]
        drawImage(classNameToSpriteSheet[unit.class][unit.army],
                  toRealX(unit.x), toRealY(unit.y),
                  tileWidth(), tileHeight(),
                  5 + 20*(floor(currentTime()*3) % 3),30, TILE_DIMENSION, TILE_DIMENSION) 
    }
}

/** returns the offset between game-data x/y and the x/y coordinate onscreen */
function amountCursorMovedToRight() {
    return clamp((1 + cursor.x) - SCREEN_TILES_X,0, currentMap.width - (SCREEN_TILES_X ))
}
function amountCursorMovedDown() {
    return clamp((1 + cursor.y) - SCREEN_TILES_Y,0, currentMap.height- (SCREEN_TILES_Y ))
}
function drawCursor() {
    drawImage(cursor.img, 
              (cursor.x - cursorOffscreenX) * screenWidth / SCREEN_TILES_X, 
              (cursor.y - cursorOffscreenY) * screenHeight / SCREEN_TILES_Y,
              screenWidth / SCREEN_TILES_X,
              screenHeight/ SCREEN_TILES_Y)
}

/** draws colored tiles, etc to help with moving */
function drawMoveDetails() {
    if (moveDetails.moving) {
        var moveAmount = moveDetails.unit.Movement//moveDetails.unit.move (eventually once more complex units exist, this will be real
        for (var x = -moveAmount; x <= moveAmount; ++x) {
            for (var y = -(moveAmount - abs(x)); y <= moveAmount - abs(x); ++y) {
                var drawX = toRealX(moveDetails.loc.x + x) 
                var drawY = toRealY(moveDetails.loc.y + y)
                if (drawX >= 0 && drawX <= SCREEN_TILES_X * tileWidth() &&
                    drawY >= 0 && drawY <= SCREEN_TILES_Y * tileHeight()) {
                    fillRectangle(drawX, drawY, tileWidth(), tileHeight(), makeColor(87 / 255, 221 / 255, 208 / 255, .5))
                }
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

function getAttackData(attacker, defender) {
    var attackerData = new Object()
    var attackWeapon = weaponData[attacker.weapons[0]]
    var defendWeapon = weaponData[defender.weapons[0]]
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

function applyAttackData(attacker, defender, attackerData, defenderData) {
    attackerData.numAttacks--
    if (percentChance(attackerData.Accuracy)) {
        if (percentChance(attackerData.Crit)) {
            attackerData.Might *= 3
        }
        defender.currentHP -= attackerData.Might
        defender.currentHP = max(defender.currentHP, 0)
    }
}

function performAttack(attacker, defender) {

    var attackerData = getAttackData(attacker, defender)
    var defenderData = getAttackData(defender, attacker)
    while (attackerData.numAttacks + defenderData.numAttacks > 0) {
        if (attackerData.numAttacks > 0) {
            applyAttackData(attacker, defender, attackerData, defenderData)
        }
        if (defenderData.numAttacks > 0) {
            applyAttackData(defender, attacker, defenderData, attackerData)
        }
    }
    attacker.active = false
    attackSquareSelect.on = false
}


function performMenuSelection() {
    var selection = endMoveMenu.options[endMoveMenu.selected]
    if (selection === "Wait") {
        endMoveMenu.unit.active = false
        endMoveMenu.on = false
    } else if (selection === "Attack") {
        endMoveMenu.on = false
        attackSquareSelect.on = true
        attackSquareSelect.options  = getNeighborsWithEnemies(endMoveMenu.unit)
        attackSquareSelect.selected = 0
        var unit = attackSquareSelect.options[attackSquareSelect.selected].unit
        moveCursorTo(unit.x, unit.y)
    }
}

function getNeighbors(unit) {
    var ret = new Array()
    if (unit.x > 0) {
        ret.push(currentMap.tile[unit.x-1][unit.y])
    }
    if (unit.y > 0) {
        ret.push(currentMap.tile[unit.x][unit.y-1])
    }
    if (unit.x < currentMap.width - 1) {
        ret.push(currentMap.tile[unit.x+1][unit.y])
    }
    if (unit.y < currentMap.height - 1) {
        ret.push(currentMap.tile[unit.x][unit.y+1])
    }
    return ret
}

function getNeighborsWithEnemies(unit) {
    var neighbors = getNeighbors(unit)
    for (var i = neighbors.length - 1; i >= 0; --i) {
        if (!(neighbors[i].unit !== NOUNIT && 
              neighbors[i].unit.army !== unit.army)) {
            removeAt(neighbors, i)
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
        for (var j = 1; j < unit.level; ++j) {
            applyGrowth(unit, classData[unit.class].growth)
        }
        ret.tile[unit.x][unit.y].unit = unit
        unit.currentHP = unit.HP
    }
    ret.width  = maxX
    ret.height = maxY + 1
    return ret
}

function applyGrowth(unit, growth) {
    for (var x in growth) {
        if (randomReal(0,1) < growth[x]) {
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
    if (cursor.moving && cursor.dir == getDirFromKey(key)) {
        cursor.moving = false
    }
}

function onKeyStart(key) {
    if (onLevel) {
        if (endMoveMenu.on) {
            if (key === UP_ARROW) {
                endMoveMenu.selected -= 1
                endMoveMenu.selected += endMoveMenu.options.length
                endMoveMenu.selected %= endMoveMenu.options.length
            } else if (key === DOWN_ARROW) {
                endMoveMenu.selected += 1
                endMoveMenu.selected %= endMoveMenu.options.length
            } else if (key === B_KEY) {
                moveUnitTo(moveDetails.unit, moveDetails.loc.x, moveDetails.loc.y)
                endMoveMenu.on = false
            } else if (key === A_KEY) {
                performMenuSelection()
            }
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
            } else if (key === A_KEY) {
                performAttack(endMoveMenu.unit, attackSquareSelect.options[attackSquareSelect.selected].unit)
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
                    if (currentMap.tile[cursor.x][cursor.y].unit !== NOUNIT &&
                        currentMap.tile[cursor.x][cursor.y].unit.active) {
                        moveDetails.moving = true
                        moveDetails.loc = { x: cursor.x, y: cursor.y }
                        moveDetails.unit = currentMap.tile[cursor.x][cursor.y].unit
                    }
                } else {
                    if (moveDetails.unit.army === "ally" && L1Norm(moveDetails.loc, cursor) <= moveDetails.unit.Movement) {
                        /** Will have to do walking animation, but of all the things to cut corners on, this is it */
                        moveUnitTo(moveDetails.unit, cursor.x, cursor.y)
                        endMoveMenu = { on : true, selected : 0, options : [], unit : moveDetails.unit}
                    }
                    moveDetails.moving = false
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

function onSetup() {
    cursorOffscreenX = 0 
    cursorOffscreenY = 0
    endMoveMenu = { on : false, selected : 0, options : [], unit : NOUNIT}
    onLevel = true
    /** This could eventually be loaded from some more complex stuff */
    alliedUnits =  [ { name : "Jaffar", class : "Assassin", level : 1, weapons : [ "Iron Sword"] } ]
    setUpAllies()
    cursor  = { img: loadImage('Cursor.png'), x: 0, y: 0, lastPressTime : currentTime()}
    currentMap = loadMap('map1.json', 'TileSet.png')
    moveDetails = { moving: false }
    attackSquareSelect = { on: false, options : [], selected: 0}
}

function onTick() {
    if (onLevel) { 
        drawMap()
        drawMoveDetails()
        drawUnits()
        drawUnitDetail()
        drawEndMoveMenu()
        updateCursor()
        drawCursor()
    }
}