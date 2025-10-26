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
    playerName: string;
    position: Vec;
    color: string;
}

export interface GameState {
    boids: BoidState[];
    predators: PredatorState[];
    gameStarted: boolean;
    roomId: string;
}

export interface LobbyInfo {
    roomId: string;
    roomName: string;
    hostName: string;
    playerCount: number;
    maxPlayers: number;
    boidGroups: number;
    boidsPerGroup: number;
    status: 'waiting' | 'in_progress' | 'finished';
}

export interface CreateLobbyRequest {
    playerName: string;
    roomName?: string;
    boidGroups: number;
    boidsPerGroup: number;
    maxPlayers: number;
}

export interface JoinLobbyRequest {
    playerName: string;
    roomId: string;
}

export interface UpdatedPositionRequest {
    position: Vector2D;
}

export interface ClientMessage {
    type: 'create_lobby' | 'join_lobby' | 'input' | 'start_game' | 'leave_lobby' | 'get_lobbies';
    payload?: CreateLobbyRequest | JoinLobbyRequest | UpdatedPositionRequest;
    playerId: string;
}

export interface ServerMessage {
    type: 'lobby_created' | 'lobby_joined' | 'game_state' | 'lobby_list' | 'player_joined' | 'player_left' | 'game_started' | 'error';
    gameState?: GameState;
    lobby?: LobbyInfo;
    lobbies?: LobbyInfo[];
    playerId?: string;
    predatorId?: string;
    error?: string;
}