import { Boid } from './Boid';
import { Predator } from './Predator';
import {GameState, Vector2D} from '../types/index';
import {Vec} from "../utils/Vec";

export class Game {
    private boids: Boid[] = [];
    private predators: Predator[] = [];
    private canvasWidth = 800;
    private canvasHeight = 600;
    private gameStarted = false;

    private readonly predatorColors = ['#F44336', '#2196F3', '#4CAF50', '#FFEB3B'];

    constructor() {
        this.initializeBoids(200);
    }

    private initializeBoids(count: number): void {
        this.boids = [];
        for (let i = 0; i < count; i++) {
            const x = Math.random() * (this.canvasWidth - 200) + 100;
            const y = Math.random() * (this.canvasHeight - 200) + 100;
            this.boids.push(new Boid(x, y));
        }
    }

    addPlayer(playerId: string): string | null {
        if (this.predators.length >= 4) return null;

        const color = this.predatorColors[this.predators.length];
        const predator = new Predator(playerId, color, this.canvasWidth/2, this.canvasHeight/2);

        this.predators.push(predator);

        return predator.id;
    }

    removePlayer(playerId: string): void {
        this.predators = this.predators.filter(p => p.playerId !== playerId);
    }

    updatePlayerPosition(playerId: string, position: Vector2D): void {
        const predator = this.predators.find(p => p.playerId === playerId);
        if (predator) {
            predator.setClientPosition(new Vec(position.x, position.y));
        }
    }

    update(): void {
        if (!this.gameStarted) return;

        this.predators.forEach(predator => {
            predator.update(this.canvasWidth, this.canvasHeight);
        });

        this.boids.forEach(boid => {
            boid.flock(this.boids, this.predators);
            boid.update(this.canvasWidth, this.canvasHeight);
        });
    }

    startGame(): void {
        this.gameStarted = true;
    }

    getState(): GameState {
        return {
            boids: this.boids.map(boid => boid.getState()),
            predators: this.predators.map(predator => predator.getState()),
            gameStarted: this.gameStarted
        };
    }

    isGameComplete(): boolean {
        const separatedCount = this.boids.filter(boid => boid.separated).length;
        return separatedCount === this.boids.length;
    }

    getPlayerCount(): number {
        return this.predators.length;
    }
}