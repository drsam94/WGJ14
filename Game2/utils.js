/** Basic utility functions that I like to have around */


/**
 * Randomize array element order in-place.
 * Using Fisher-Yates shuffle algorithm.
 * Borrowed from http://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
 */

function componentwiseEqual(o1, o2) {
    for (x in o1) {
        if (o1[x] !== o2[x]) {
            return false
        }
    }
    return true
}

function EqXY(o1, o2) {
    return o1.x === o2.x && o1.y === o2.y
}

function sign(x) {
    return x < 0 ? -1 : 1
}

function shuffle(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

Array.prototype.containsXY = function(obj) {
    for (var i = 0; i < this.length; ++i) {
        if (EqXY(obj, this[i])) {
            return true
        }
    }
    return false
}
Array.prototype.contains = function(obj) {
    for (var i = 0; i < this.length; ++i) {
        if (componentwiseEqual(obj, this[i])) {
            return true
        }
    }
    return false
}
Array.prototype.setAdd = function(obj) {
    if (!this.contains(obj)) {
        this.push(obj)
    }
}
Array.prototype.remove = function(obj) {
    for (var i = 0; i < this.length; ++i) {
        if (obj === this[i]) {
            this.splice(i,1)
            return
        }
    }
}
Array.prototype.removeAt = function(i) {
    this.splice(i, 1)
}
Array.prototype.sortBasedOnMetric = function(metric) {
    return this.sort(function(o1, o2) { return metric(o1) - metric(o2)})
}
Array.prototype.getMinBasedOnMetric = function(metric) {
    var minElem = this[0]
    for (var i = 0; i < this.length; ++i) {
        if (metric(this[i]) < metric(minElem)) {
            minElem = this[i]
        }
    }
    return minElem
}

function cloneObject(obj) {
    var o2 = new Object()
    for (x in obj) {
        o2[x] = obj[x]
    }
    return o2
}

function L1Distance(o1, o2) {
    return abs(o1.x - o2.x) + abs(o1.y - o2.y)
}