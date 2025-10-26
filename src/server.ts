import express from 'express';
import {WebSocketServer, WebSocket} from 'ws';
import {createServer} from 'http';
import {Game} from './game/Game.js';
import {ClientMessage, ServerMessage} from './types/index';
import {v4 as uuidv4} from 'uuid';
import {GameConnectionManager} from "./game/ConnectionManager";

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({noServer: true});
// const wss = new WebSocketServer({ server });

server.on('upgrade', (request, socket, head) => {
    if (request.url === '/api/ds_socket') { // Define a specific path for WebSocket connections
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    } else {
        socket.destroy();
    }
});

const game = new Game();
const gameConnectionManager = new GameConnectionManager();

// Middleware
app.use(express.json());

wss.on('connection', (ws: WebSocket) => {
    const playerId = uuidv4();
    gameConnectionManager.addClient(playerId, ws)

    const predatorId = game.addPlayer(playerId);

    if (predatorId) {
        gameConnectionManager.sendDirectMessage({
            type: 'player_joined',
            playerId,
            predatorId
        }, ws)

        gameConnectionManager.sendDirectMessage({
            type: 'game_state',
            gameState: game.getState(),
            playerId
        }, ws)
    } else {
        gameConnectionManager.sendDirectMessage({
            type: 'error',
            error: 'Game is full'
        }, ws)
        ws.close();
        return;
    }

    ws.on('message', (data: Buffer) => {
        try {
            const message: ClientMessage = JSON.parse(data.toString());

            switch (message.type) {
                case 'input':
                    if (message.position) {
                        game.updatePlayerPosition(message.playerId, message.position)
                    }
                    break;

                case 'start_game':
                    if (game.getPlayerCount() >= 1) {
                        game.startGame();
                        gameConnectionManager.broadcast({
                            type: 'game_started'
                        })
                    }
                    break;
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    ws.on('close', () => {
        console.log(`Player ${playerId} disconnected`);
        game.removePlayer(playerId);
        gameConnectionManager.removeClient(playerId);
    });

    ws.on('error', (error) => {
        console.error(`WebSocket error for player ${playerId}:`, error);
        game.removePlayer(playerId);
        gameConnectionManager.removeClient(playerId);
    });
});

// upd 60 FPS
setInterval(() => {
    game.update();

    // Рассылаем состояние игры всем подключенным клиентам
    gameConnectionManager.broadcast({
        type: 'game_state',
        gameState: game.getState()
    })

    // Проверяем завершение игры
    if (game.isGameComplete()) {
        console.log('Game completed! All boids are separated by color.');
    }
}, 1000 / 60);


const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`WebSocket server ready for connections`);
});