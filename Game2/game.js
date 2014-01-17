/** Fire Emblem X Pokemon
 *  (c) 2014 Sam Donow
 *  The Williams Game Jam 2014 
 */
include('utils2.js')
include('tiles.js')

var RIGHT_ARROW = 39
var LEFT_ARROW  = 37
var UP_ARROW    = 38
var DOWN_ARROW  = 40

var SCREEN_TILES_X = 8
var SCREEN_TILES_Y = 8
var TILE_DIMENSION = 16
var onLevel
var cursor
var currentMap

/** Draws all of the tiles for the map, this is called every frame */
function drawMap() {
    //find offset to where drawing must start
    var xIncrease = amountCursorMovedToRight()
    var yIncrease = amountCursorMovedDown()
    for (var x = xIncrease; x < xIncrease + SCREEN_TILES_X; ++x) {
        for (var y = yIncrease; y < yIncrease + SCREEN_TILES_Y; ++y) {
            drawImage(currentMap.img, 
                      (x-xIncrease)*(screenWidth / SCREEN_TILES_X), (y-yIncrease)*(screenHeight / SCREEN_TILES_Y),
                      screenWidth / SCREEN_TILES_X, screenHeight / SCREEN_TILES_Y,
                      currentMap.tile[x][y].x*(1+TILE_DIMENSION)+1, 
                      currentMap.tile[x][y].y*(1+TILE_DIMENSION)+1, 
                      TILE_DIMENSION, TILE_DIMENSION)
        }
    }
}

function drawUnits() {

}

function amountCursorMovedToRight() {
    return clamp((1 + cursor.x) - SCREEN_TILES_X,0, currentMap.width - (SCREEN_TILES_X ) - 1)
}
function amountCursorMovedDown() {
    return clamp((1 + cursor.y) - SCREEN_TILES_Y,0, currentMap.height- (SCREEN_TILES_Y ) - 1)
}
function drawCursor() {
    drawImage(cursor.img, 
              (cursor.x - amountCursorMovedToRight()) * screenWidth / SCREEN_TILES_X, 
              (cursor.y - amountCursorMovedDown()) * screenHeight / SCREEN_TILES_Y,
              screenWidth / SCREEN_TILES_X,
              screenHeight/ SCREEN_TILES_Y)
}

function loadMap(mapFileName, imageFileName) {
    var stringRep = getRemoteFileAsString(mapFileName)
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
            ret.tile[x].push(AsciiToTileXY[stringRep.charAt(i)])
            ++x
        }
    }
    ret.width  = maxX + 1
    ret.height = maxY + 1
    return ret
}

function onKeyStart(key) {
    if (onLevel) {
        if (key === RIGHT_ARROW) {
            if (cursor.x < currentMap.width - 1) {
                ++cursor.x
            }
        } else if (key === LEFT_ARROW) {
            if (cursor.x > 0) {
                --cursor.x
            }
        } else if (key === DOWN_ARROW) {
            if (cursor.y < currentMap.height - 1) {
                ++cursor.y
            }
        } else if (key === UP_ARROW) {
            if (cursor.y > 0) {
                --cursor.y
            }
        }
    }
}

function onSetup() {
    onLevel = true
    cursor  = { img: loadImage('Cursor.png'), x: 0, y: 0}
    currentMap = loadMap('map1.map', 'TileSet.png')
}

function onTick() {
    if (onLevel) { 
        drawMap()
        drawUnits()
        drawCursor()
    }
}
