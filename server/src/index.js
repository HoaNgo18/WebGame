import express from 'express';
import cors from 'cors';
import { Server } from './core/Server.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});

// Start HTTP server
const HTTP_PORT = 8080;
app.listen(HTTP_PORT, () => {
    console.log(`HTTP server running on port ${HTTP_PORT}`);
});

// Start WebSocket server
const WS_PORT = 3000;
const gameServer = new Server(WS_PORT);
gameServer.start();
