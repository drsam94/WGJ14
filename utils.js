/** Basic utility functions used in Dominion Game */


/**
 * Randomize array element order in-place.
 * Using Fisher-Yates shuffle algorithm.
 * Borrowed from http://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
 */
function shuffle(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

function clearArray(array) {
    array = new Array()
    return array
}

Array.prototype.remove = function(obj) {
    for (var i = 0; i < this.length; ++i) {
        if (obj === this[i]) {
            this.splice(i,1)
            return
        }
    }
}
