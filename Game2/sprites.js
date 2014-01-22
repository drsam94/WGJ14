
var AsciiToTileXY = {
    '*' : { x: 0, y: 0, type: "Plain"},
    '~' : { x: 4, y: 12, type: "Forest"},
    '^' : { x: 0, y: 4, type: "Mountain"}
}

var classNameToSpriteSheet = {
    "Assassin" : { "ally" : loadImage("Sprites/assassinAlly.png"), "enemy" : loadImage("Sprites/assassinEnemy.png") }
}