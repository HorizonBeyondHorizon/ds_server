import {BoidState} from '../types/index';
import {v4 as uuidv4} from 'uuid';
import {Predator} from "./Predator";
import {Vec} from "../utils/Vec";

export class Boid {
    public id: string;
    public position: Vec;
    public velocity: Vec;
    public acceleration: Vec;
    public color: string;
    public separated: boolean;

    private maxSpeed = 2.5;
    private maxForce = 0.05;
    private perceptionRadius = 60;
    private fleeRadius = 60;

    constructor(x: number, y: number) {
        this.id = uuidv4();
        this.position = new Vec( x, y );
        this.velocity = new Vec( 0, 0 );
        this.acceleration = new Vec( 0, 0 );

        const colors = ['#4CAF50', '#F44336', '#2196F3', '#FFEB3B'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.separated = false;
    }

    flock(boids: Boid[], predators: Predator[]): void {

        const separation = this.separate(boids).scale(1.8);
        const alignment = this.align(boids).scale(1.2);
        const cohesion = this.cohere(boids).scale(1.2);
        const flee = this.flee(predators).scale(2.5);

        this.applyForce(separation);
        this.applyForce(alignment);
        this.applyForce(cohesion);
        this.applyForce(flee);

        this.checkColorSeparation(boids);
    }

    private checkColorSeparation(boids: Boid[]): void {
        let sameColorCount = 0;
        let totalNeighbors = 0;

        for (const other of boids) {
            if (other === this) continue;

            const distance = this.position.distance(other.position);
            if (distance < this.perceptionRadius) {
                totalNeighbors++;
                if (other.color === this.color) {
                    sameColorCount++;
                }
            }
        }

        this.separated = totalNeighbors > 0 && sameColorCount === totalNeighbors;
    }

    private flee(predators: Predator[]): Vec {
        let steering = new Vec(0, 0);
        let total = 0;

        for (const predator of predators) {
            let distance = this.position.distance(predator.serverPosition);

            if (distance < this.fleeRadius) {
                let desired = this.position.sub(predator.serverPosition).normalize();

                const strength = (this.fleeRadius - distance) / this.fleeRadius;
                desired = desired.scale(this.maxSpeed * (1 + strength));

                let steer = desired.sub(this.velocity);
                steer = steer.limit(this.maxForce);
                steering = steering.add(steer);
                total++;
            }
        }

        return total > 0 ? steering.divide(total) : steering;
    }

    private separate(boids: Boid[]): Vec {
        let steering = new Vec(0, 0);
        let total = 0;

        for (const other of boids) {
            let distance = this.position.distance(other.position);
            if (other !== this && distance < this.perceptionRadius / 2) {
                const diff = this.position.sub(other.position).divide(distance);
                steering = steering.add(diff);
                total++;
            }
        }

        return total > 0 ? steering.divide(total).normalize().scale(this.maxSpeed).sub(this.velocity).limit(this.maxForce) : steering;
    }

    private align(boids: Boid[]): Vec {
        let steering = new Vec(0, 0);
        let total = 0;

        for (const other of boids) {
            const distance = this.position.distance(other.position);
            if (other !== this && distance < this.perceptionRadius) {
                steering = steering.add(other.velocity);
                total++;
            }
        }

        return total > 0 ? steering.divide(total).normalize().scale(this.maxSpeed).sub(this.velocity).limit(this.maxForce) : steering;
    }

    private cohere(boids: Boid[]): Vec {
        let steering = new Vec(0, 0);
        let total = 0;

        for (const other of boids) {
            let distance = this.position.distance(other.position);
            if (other !== this && distance < this.perceptionRadius) {
                steering = steering.add(other.position);
                total++;
            }
        }

        return total > 0 ? steering.divide(total).sub(this.position).normalize().scale(this.maxSpeed).sub(this.velocity).limit(this.maxForce) : steering;
    }

    applyForce(force: Vec) {
        this.acceleration = this.acceleration.add(force);
    }

    update(canvasWidth: number, canvasHeight: number): void {
        this.velocity = this.velocity.add(this.acceleration).limit(this.maxSpeed);
        this.position = this.position.add(this.velocity);
        this.acceleration  = new Vec(0, 0)
        this.edges(canvasWidth, canvasHeight);
    }

    private edges(canvasWidth: number, canvasHeight: number): void {
        const margin = 20;
        const turnFactor = 0.2;

        if (this.position.x < margin) this.velocity.x += turnFactor;
        if (this.position.x > canvasWidth - margin) this.velocity.x -= turnFactor;
        if (this.position.y < margin) this.velocity.y += turnFactor;
        if (this.position.y > canvasHeight - margin) this.velocity.y -= turnFactor;
    }

    getState(): BoidState {
        return {
            id: this.id,
            position: this.position,
            velocity: this.velocity,
            color: this.color,
            separated: this.separated
        };
    }
}