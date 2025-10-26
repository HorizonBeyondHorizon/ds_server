import {WebSocket} from "ws";
import {ServerMessage} from "../types";

export class GameConnectionManager {

    private clients: Map<string, WebSocket>;

    constructor() {
        this.clients = new Map();
    }

    addClient(playerId: string, ws: WebSocket) {
        this.clients.set(playerId, ws);
        console.log(`Player ${playerId} connected`);
    }

    removeClient(playerId: string) {
        this.clients.delete(playerId);
        console.log(`Player ${playerId} disconnected`);
    }

    getConnection(playerId: string): WebSocket | undefined {
        return this.clients.get(playerId);
    }

    sendDirectMessage(message: ServerMessage, ws: WebSocket | undefined){
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    }

    broadcast(message: ServerMessage, sender = null) {
        this.clients.forEach((ws, playerId) => {
            if (ws !== sender && ws.readyState === ws.OPEN) {
                try {
                    const data = JSON.stringify({...message, playerId});
                    ws.send(data);
                } catch (error) {
                    console.error('Broadcasting error:', error);
                    this.removeClient(playerId);
                }
            }

        });

    }
}