export class Vec {
    x: number;
    y: number;
    constructor(x: number, y: number) { this.x = x; this.y = y; }

    add(v: Vec): Vec {
        return new Vec(this.x + v.x, this.y + v.y);
    }

    sub(v: Vec): Vec {
        return new Vec(this.x - v.x, this.y - v.y);
    }

    scale(s: number): Vec {
        return new Vec(this.x * s, this.y * s);
    }

    length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize(): Vec {
        const len = this.length();
        return len > 0 ? this.scale(1 / len) : new Vec(0, 0);
    }

    distance(v: Vec): number {
        return Math.sqrt(
            (this.x - v.x) ** 2 + (this.y - v.y) ** 2
        );
    }

    divide(scalar: number) {
        return new Vec(this.x / scalar, this.y / scalar);
    }

    limit(max: number): Vec {
        const len = this.length();
        if (len > max) {
            return this.normalize().scale(max);
        }
        return new Vec(this.x, this.y);
    }
}
