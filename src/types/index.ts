import {Vec} from "../utils/Vec";

export interface Vector2D {
    x: number;
    y: number;
}

export interface BoidState {
    id: string;
    position: Vec;
    velocity: Vec;
    color: string;
    separated: boolean;
}

export interface PredatorState {
    id: string;
    playerId: string;
    position: Vec;
    color: string;
}

export interface GameState {
    boids: BoidState[];
    predators: PredatorState[];
    gameStarted: boolean;
}

export interface ClientMessage {
    type: 'join' | 'input' | 'start_game';
    playerId: string;
    position?: Vector2D;
}

export interface ServerMessage {
    type: 'game_state' | 'player_joined' | 'game_started' | 'error';
    gameState?: GameState;
    playerId?: string;
    predatorId?: string;
    error?: string;
}