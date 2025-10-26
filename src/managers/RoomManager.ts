import {LobbyInfo} from "../types";
import {GameRoom} from "../game/GameRoom";

export class RoomManager {
    private rooms: Map<string, GameRoom> = new Map();

    createRoom(roomId: string, hostName: string, options: { roomName?: string; boidGroups: number; boidsPerGroup: number; maxPlayers: number }): GameRoom {
        const room = new GameRoom(roomId, hostName, options);
        this.rooms.set(roomId, room);
        return room;
    }

    getRoom(roomId: string): GameRoom | undefined {
        return this.rooms.get(roomId);
    }

    removeRoom(roomId: string): boolean {
        return this.rooms.delete(roomId);
    }

    getLobbyInfo(roomId: string): LobbyInfo | undefined {
        const room = this.rooms.get(roomId);
        if (!room) return undefined;

        return room.getLobbyInfo();
    }

    getAllLobbies(): LobbyInfo[] {
        return [...this.rooms.values()]
            .filter(room => room.getStatus() === 'waiting')
            .map(room => room.getLobbyInfo());
    }

    cleanupEmptyRooms(): void {
        for (const [roomId, room] of this.rooms.entries()) {
            if (room.getPlayerCount() === 0) {
                this.rooms.delete(roomId);
            }
        }
    }
}