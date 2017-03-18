"use strict";
var Vector = (function () {
    function Vector(x, y) {
        this.x = x;
        this.y = y;
    }
    Vector.random = function () {
        return new Vector(10.0 * (Math.random() - 0.5), 10.0 * (Math.random() - 0.5));
    };
    Vector.prototype.add = function (v2) {
        return new Vector(this.x + v2.x, this.y + v2.y);
    };
    Vector.prototype.subtract = function (v2) {
        return new Vector(this.x - v2.x, this.y - v2.y);
    };
    Vector.prototype.multiply = function (n) {
        return new Vector(this.x * n, this.y * n);
    };
    Vector.prototype.divide = function (n) {
        return new Vector((this.x / n) || 0, (this.y / n) || 0); // Avoid divide by zero errors..
    };
    Vector.prototype.magnitude = function () {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    };
    Vector.prototype.normal = function () {
        return new Vector(-this.y, this.x);
    };
    Vector.prototype.normalise = function () {
        return this.divide(this.magnitude());
    };
    Vector.prototype.interpolate = function (p2, travel, offset) {
        if (offset === void 0) { offset = 0.0; }
        var direction = p2.subtract(this);
        if (offset) {
            var normal = direction.normal().normalise();
            return this.add(p2).multiply(travel).add(normal.multiply(offset));
        }
        else {
            return this.add(p2).multiply(travel);
        }
    };
    return Vector;
}());
exports.Vector = Vector;
function intersectLineLine(p1, p2, p3, p4) {
    var denom = ((p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y));
    // lines are parallel
    if (denom === 0) {
        return null;
    }
    var ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom;
    var ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denom;
    if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
        return null;
    }
    return new Vector(p1.x + ua * (p2.x - p1.x), p1.y + ua * (p2.y - p1.y));
}
exports.intersectLineLine = intersectLineLine;
function intersectLineBox(p1, p2, p3, w, h) {
    var tl = new Vector(p3.x, p3.y);
    var tr = new Vector(p3.x + w, p3.y);
    var bl = new Vector(p3.x, p3.y + h);
    var br = new Vector(p3.x + w, p3.y + h);
    var result;
    if (result = intersectLineLine(p1, p2, tl, tr)) {
        return result;
    } // top
    if (result = intersectLineLine(p1, p2, tr, br)) {
        return result;
    } // right
    if (result = intersectLineLine(p1, p2, br, bl)) {
        return result;
    } // bottom
    if (result = intersectLineLine(p1, p2, bl, tl)) {
        return result;
    } // left
    return null;
}
exports.intersectLineBox = intersectLineBox;
//# sourceMappingURL=math.js.map