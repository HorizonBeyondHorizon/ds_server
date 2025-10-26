import {PredatorState} from '../types/index';
import {v4 as uuidv4} from 'uuid';
import {Vec} from "../utils/Vec";

export class Predator {
    public id: string;
    public playerId: string;
    public serverPosition: Vec;
    public clientPosition: Vec;
    public color: string;
    public radius = 12;

    constructor(playerId: string, color: string, startX: number, startY: number) {
        this.id = uuidv4();
        this.playerId = playerId;
        this.serverPosition = new Vec(startX, startY);
        this.clientPosition = new Vec(startX, startY);
        this.color = color;
    }

    update(canvasWidth: number, canvasHeight: number): void {
        this.serverPosition.x = Math.max(this.radius, Math.min(canvasWidth - this.radius, this.clientPosition.x));
        this.serverPosition.y = Math.max(this.radius, Math.min(canvasHeight - this.radius, this.clientPosition.y));
    }

    setClientPosition(clientPosition: Vec): void{
        this.clientPosition = clientPosition;
    }

    getState(): PredatorState {
        return {
            id: this.id,
            playerId: this.playerId,
            position: this.serverPosition,
            color: this.color,
        };
    }
}