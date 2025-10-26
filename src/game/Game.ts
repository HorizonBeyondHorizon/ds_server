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

    constructor(boidGroups: number, boidsPerGroup: number) {
        this.initializeBoids(boidGroups, boidsPerGroup);
    }

    private initializeBoids(boidGroups: number, boidsPerGroup: number): void {
        this.boids = [];

        const colors = ['#4CAF50', '#F44336', '#2196F3', '#FFEB3B'].slice(0, boidGroups);

        for (let i = 0; i < boidGroups; i++) {
            for (let j = 0; j < boidsPerGroup; j++) {
                const x = Math.random() * (this.canvasWidth - 200) + 100;
                const y = Math.random() * (this.canvasHeight - 200) + 100;
                const boid = new Boid(x, y, colors[i]);
                this.boids.push(boid);
            }
        }
    }

    addPlayer(playerId: string,  playerName: string): string | null {
        if (this.predators.length >= 4) return null;

        const color = this.predatorColors[this.predators.length];
        const predator = new Predator(playerId, playerName, color, this.canvasWidth/2, this.canvasHeight/2);

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

    getState(): Omit<GameState, "roomId"> {
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