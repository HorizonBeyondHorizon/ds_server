import { Game } from './Game.js';
import {GameState, LobbyInfo, Vector2D} from "../types";

export class GameRoom {
    public roomId: string;
    public roomName: string;
    public hostName: string;
    public boidGroups: number;
    public boidsPerGroup: number;
    public maxPlayers: number;

    private game: Game;
    // private players: Map<string, { playerName: string; predatorId: string }> = new Map();
    private status: 'waiting' | 'in_progress' | 'finished' = 'waiting';

    constructor(roomId: string, hostName: string, options: { roomName?: string; boidGroups: number; boidsPerGroup: number; maxPlayers: number }) {
        this.roomId = roomId;
        this.hostName = hostName;
        this.roomName = options.roomName || `Room ${roomId}`;
        this.boidGroups = options.boidGroups;
        this.boidsPerGroup = options.boidsPerGroup;
        this.maxPlayers = options.maxPlayers;

        this.game = new Game(this.boidGroups, this.boidsPerGroup);
    }

    addPlayer(playerId: string, playerName: string): string | null {
        // if (this.players.size >= this.maxPlayers) return null;

        // Добавляем игрока в игру
        const predatorId = this.game.addPlayer(playerId, playerName);
        if (!predatorId) return null;

        // this.players.set(playerId, { playerName, predatorId });
        return predatorId;
    }

    removePlayer(playerId: string): void {
        this.game.removePlayer(playerId);
        // this.players.delete(playerId);
    }

    updatePlayerPosition(playerId: string, position: Vector2D): void {
        this.game.updatePlayerPosition(playerId, position);
    }

    startGame(): void {
        this.status = 'in_progress';
        this.game.startGame();
    }

    update(): void {
        this.game.update();

        if (this.game.isGameComplete()) {
            this.status = 'finished';
        }
    }

    getGameState(): GameState {
        const gameState = this.game.getState();
        return {
            ...gameState,
            roomId: this.roomId
        };
    }

    getLobbyInfo(): LobbyInfo {
        return {
            roomId: this.roomId,
            roomName: this.roomName,
            hostName: this.hostName,
            playerCount: this.game.getPlayerCount(),
            maxPlayers: this.maxPlayers,
            boidGroups: this.boidGroups,
            boidsPerGroup: this.boidsPerGroup,
            status: this.status
        };
    }

    getStatus(): string {
        return this.status;
    }

    getPlayerCount(): number {
        return this.game.getPlayerCount();
    }
}