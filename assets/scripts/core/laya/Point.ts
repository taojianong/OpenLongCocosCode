import Pool from "./Pool";

/**
 * 
 * @author clong 2022.04.16
 */
export default class Point {

    public x: number = 0;
    public y: number = 0;

    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    static create() {
        return Pool.getItemByClass("Point", Point);
    }
    setTo(x: number, y: number) {
        this.x = x;
        this.y = y;
        return this;
    }
    reset() {
        this.x = this.y = 0;
        return this;
    }
    recover() {
        Pool.recover("Point", this.reset());
    }
    distance(x: number, y: number) {
        return Math.sqrt((this.x - x) * (this.x - x) + (this.y - y) * (this.y - y));
    }
    toString() {
        return this.x + "," + this.y;
    }
    normalize() {
        var d = Math.sqrt(this.x * this.x + this.y * this.y);
        if (d > 0) {
            var id = 1.0 / d;
            this.x *= id;
            this.y *= id;
        }
    }
    copy(point: Point) {
        return this.setTo(point.x, point.y);
    }
}