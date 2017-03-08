export interface Point {
    x: number;
    y: number;
}
export interface Rectangle {
    bottomLeft: Vector;
    topRight: Vector;
}
export interface Size {
    width: number,
    height: number
}
export class Vector implements Point {
    constructor(public x: number, public y: number) {
    }

    public static random(): Vector {
        return new Vector(10.0 * (Math.random() - 0.5), 10.0 * (Math.random() - 0.5));
    }

    public add(v2: Vector): Vector {
        return new Vector(this.x + v2.x, this.y + v2.y);
    }

    public subtract(v2: Vector): Vector {
        return new Vector(this.x - v2.x, this.y - v2.y);
    }

    public multiply(n: number): Vector {
        return new Vector(this.x * n, this.y * n);
    }

    public divide(n: number): Vector {
        return new Vector((this.x / n) || 0, (this.y / n) || 0); // Avoid divide by zero errors..
    }

    public magnitude(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    public normal(): Vector {
        return new Vector(-this.y, this.x);
    }

    public normalise() {
        return this.divide(this.magnitude());
    }
}

export function intersectLineLine(p1: Vector, p2: Vector, p3: Vector, p4: Vector): Vector {

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



export function intersectLineBox(p1: Vector, p2: Vector, p3: Vector, w: number, h: number): Vector {

    var tl = new Vector(p3.x, p3.y);

    var tr = new Vector(p3.x + w, p3.y);

    var bl = new Vector(p3.x, p3.y + h);

    var br = new Vector(p3.x + w, p3.y + h);



    var result;

    if (result = intersectLineLine(p1, p2, tl, tr)) { return result; } // top

    if (result = intersectLineLine(p1, p2, tr, br)) { return result; } // right

    if (result = intersectLineLine(p1, p2, br, bl)) { return result; } // bottom

    if (result = intersectLineLine(p1, p2, bl, tl)) { return result; } // left

    return null
}