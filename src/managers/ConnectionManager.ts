import {WebSocket} from "ws";
import {ServerMessage} from "../types";

interface IGameConnectionManagerMapItem {
    ws: WebSocket;
    roomId?: string
}

export class GameConnectionManager {

    private clients: Map<string, IGameConnectionManagerMapItem>;

    constructor() {
        this.clients = new Map();
    }

    addClient(playerId: string, ws: WebSocket) {
        this.clients.set(playerId, {ws});
        console.log(`Player ${playerId} connected`);
    }

    removeClient(playerId: string) {
        this.clients.delete(playerId);
        console.log(`Player ${playerId} disconnected`);
    }

    getAllClients(): Map<string, IGameConnectionManagerMapItem>{
        return this.clients
    }

    getConnection(playerId: string): IGameConnectionManagerMapItem | undefined {
        return this.clients.get(playerId);
    }

    setClientRoomID(playerId: string, roomId: string): void {
        const connection = this.clients.get(playerId);
        if(connection){
            this.clients.set(playerId, {
                ...connection,
                roomId
            })
        }
    }

    sendDirectMessage(message: ServerMessage, ws: WebSocket | undefined) {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    }

    broadcastToRoom(roomId: string, message: ServerMessage, sender = null, excludePlayerId?: string) {
        this.clients.forEach((client, playerId) => {
            if (client.roomId === roomId && playerId !== excludePlayerId && client.ws !== sender && client.ws.readyState === client.ws.OPEN) {
                try {
                    const data = JSON.stringify({...message, playerId});
                    client.ws.send(data);
                } catch (error) {
                    console.error('Broadcasting error:', error);
                    this.removeClient(playerId);
                }
            }

        });

    }
}