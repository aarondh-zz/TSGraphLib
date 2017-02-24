export interface Point {
    x: number;
    y: number;
}
export interface Rectangle {
    bottomLeft: Vector;
    topRight: Vector;
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
