
var AsciiToTileXY = {
    '*' : { x: 0, y: 0, type: "Plain"},
    '~' : { x: 4, y: 12, type: "Forest"},
    '^' : { x: 0, y: 4, type: "Mountain"}
}

var spriteData = {
    "Assassin" : {start : 5,  width: [0,20,40], sheet: { "ally" : loadImage("Sprites/assassinAlly.png"), "enemy" : loadImage("Sprites/assassinEnemy.png") }},
    "Myrmidon" : {start : 143, width: [0,19,39], sheet: { "ally" : loadImage("Sprites/myrmidonAlly.png"), "enemy" : loadImage("Sprites/myrmidonEnemy.png") }}
}