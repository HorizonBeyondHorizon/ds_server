import express from 'express';
import dotenv from "dotenv";
import {WebSocket, WebSocketServer} from 'ws';
import {createServer} from 'http';
import {ClientMessage, CreateLobbyRequest, JoinLobbyRequest, UpdatedPositionRequest} from './types/index';
import {v4 as uuidv4} from 'uuid';
import {GameConnectionManager} from "./managers/ConnectionManager";
import {RoomManager} from "./managers/RoomManager";

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({noServer: true});
// const wss = new WebSocketServer({ server });

server.on('upgrade', (request, socket, head) => {
    if (request.url === '/api/ds_socket') {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    } else {
        socket.destroy();
    }
});

const gameConnectionManager = new GameConnectionManager();
const roomManager = new RoomManager();

// Middleware
app.use(express.json());

wss.on('connection', (ws: WebSocket) => {
    const playerId = uuidv4();
    gameConnectionManager.addClient(playerId, ws)

    ws.on('message', (data: Buffer) => {
        try {
            const message: ClientMessage = JSON.parse(data.toString());

            switch (message.type) {
                case 'create_lobby': {
                    const request = message.payload as CreateLobbyRequest;
                    const roomId = uuidv4().slice(0, 8);

                    const room = roomManager.createRoom(roomId, request.playerName, {
                        roomName: request.roomName,
                        boidGroups: request.boidGroups,
                        boidsPerGroup: request.boidsPerGroup,
                        maxPlayers: request.maxPlayers
                    });

                    const predatorId = room.addPlayer(playerId, request.playerName);
                    if (predatorId) {
                        gameConnectionManager.setClientRoomID(playerId, roomId);

                        gameConnectionManager.sendDirectMessage({
                            type: 'lobby_created',
                            lobby: room.getLobbyInfo(),
                            playerId,
                            predatorId
                        }, ws);
                    } else {
                        gameConnectionManager.sendDirectMessage( {
                            type: 'error',
                            error: 'Failed to create lobby'
                        }, ws);
                    }
                    break;
                }

                case 'join_lobby': {
                    //TODO: fix the issue that each new predator speeds up boids
                    const request = message.payload as JoinLobbyRequest;
                    const room = roomManager.getRoom(request.roomId);

                    if (!room) {
                        gameConnectionManager.sendDirectMessage( {
                            type: 'error',
                            error: 'Room not found'
                        }, ws);
                        return;
                    }

                    const predatorId = room.addPlayer(playerId, request.playerName);
                    if (predatorId) {
                        gameConnectionManager.setClientRoomID(playerId, request.roomId);

                        gameConnectionManager.broadcastToRoom(request.roomId, {
                            type: 'player_joined',
                            playerId,
                            predatorId
                        });

                        gameConnectionManager.sendDirectMessage( {
                            type: 'lobby_joined',
                            lobby: room.getLobbyInfo(),
                            playerId,
                            predatorId
                        }, ws);
                    } else {
                        gameConnectionManager.sendDirectMessage( {
                            type: 'error',
                            error: 'Room is full'
                        }, ws);
                    }
                    break;
                }

                case 'get_lobbies': {
                    const lobbies = roomManager.getAllLobbies();
                    gameConnectionManager.sendDirectMessage( {
                        type: 'lobby_list',
                        lobbies
                    }, ws);
                    break;
                }

                case 'input': {
                    const client = gameConnectionManager.getConnection(playerId);
                    const request = message.payload as UpdatedPositionRequest;
                    if (client && client.roomId) {
                        const gameRoom = roomManager.getRoom(client.roomId);
                        if (gameRoom) {
                            gameRoom.updatePlayerPosition(playerId, request.position);
                        }
                    }
                    break;
                }

                case 'start_game': {
                    const client = gameConnectionManager.getConnection(playerId);
                    if (client && client.roomId) {
                        const gameRoom = roomManager.getRoom(client.roomId);
                        if (gameRoom) {
                            gameRoom.startGame();
                            gameConnectionManager.broadcastToRoom(client.roomId, {
                                type: 'game_started'
                            });
                        }
                    }
                    break;
                }

                case 'leave_lobby': {
                    const client = gameConnectionManager.getConnection(playerId);
                    if (client && client.roomId) {
                        const gameRoom = roomManager.getRoom(client.roomId);
                        if (gameRoom) {
                            gameRoom.removePlayer(playerId);
                            gameConnectionManager.broadcastToRoom(client.roomId, {
                                type: 'player_left',
                                playerId
                            });

                            if (gameRoom.getPlayerCount() === 0) {
                                roomManager.removeRoom(client.roomId);
                            }

                            client.roomId = undefined;
                        }
                    }
                    break;
                }
            }
        } catch (error) {
            console.error('Error processing message:', error);
            gameConnectionManager.sendDirectMessage({
                type: 'error',
                error: 'Invalid message format'
            }, ws)
        }
    });

    ws.on('close', () => {
        const client = gameConnectionManager.getConnection(playerId);
        if (client && client.roomId) {
            const gameRoom = roomManager.getRoom(client.roomId);
            if (gameRoom) {
                gameRoom.removePlayer(playerId);
                gameConnectionManager.broadcastToRoom(client.roomId, {
                    type: 'player_left',
                    playerId
                });

                if (gameRoom.getPlayerCount() === 0) {
                    roomManager.removeRoom(client.roomId);
                }
            }
        }

        gameConnectionManager.removeClient(playerId);
    });

    ws.on('error', (error) => {
        console.error(`WebSocket error for player ${playerId}:`, error);

        const client = gameConnectionManager.getConnection(playerId);
        if (client && client.roomId) {
            const gameRoom = roomManager.getRoom(client.roomId);
            if (gameRoom) {
                gameRoom.removePlayer(playerId);
                gameConnectionManager.broadcastToRoom(client.roomId, {
                    type: 'player_left',
                    playerId
                });

                if (gameRoom.getPlayerCount() === 0) {
                    roomManager.removeRoom(client.roomId);
                }
            }
        }

        gameConnectionManager.removeClient(playerId);
    });
});

// upds game 60 times per sec
setInterval(() => {
    //TODO: think about changing approach to loop through rooms, not clients
    gameConnectionManager.getAllClients().forEach((client, playerId) => {
        if (client.roomId) {
            const gameRoom = roomManager.getRoom(client.roomId);
            if (gameRoom) {
                if(gameRoom.getStatus() === "finished"){
                    //TODO: fix
                    console.log('Game completed! All boids are separated by color.');
                } else {
                    gameRoom.update();

                    const gameState = gameRoom.getGameState();
                    gameConnectionManager.sendDirectMessage({
                        type: 'game_state',
                        gameState
                    }, client.ws)
                }
            }
        }
    });
}, 1000 / 60);

setInterval(() => {
    roomManager.cleanupEmptyRooms();
}, 5 * 60 * 1000);


const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`WebSocket server ready for connections`);
});