import { Server } from './core/Server.js';
import express from 'express';
import cors from 'cors';
import { connectDB } from './db/mongo.js';
import authRouter from './api/auth.js';
import config from './config.js';
import { User } from './db/models/User.model.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// REST API routes
app.use('/api/auth', authRouter);

// Leaderboard route
app.get('/api/leaderboard', async (req, res) => {
    try {
        const topPlayers = await User.find()
            .sort({ highScore: -1 })
            .limit(10)
            .select('username highScore totalKills totalDeaths arenaWins arenaTop2 arenaTop3');

        res.json(topPlayers);
    } catch (err) {
        console.error('Leaderboard error:', err);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});

// Start HTTP server
const PORT = config.HTTP_PORT || 8080;
app.listen(PORT, () => {
    console.log(`HTTP API server running on port ${PORT}`);
});

// Start WebSocket game server immediately (don't wait for MongoDB)
const gameServer = new Server(config.WS_PORT || 3000);
gameServer.start();
console.log(`WebSocket game server started on port ${config.WS_PORT || 3000}`);

// Connect to MongoDB (optional for development)
connectDB().then(() => {
    console.log('MongoDB connected - database features enabled');
}).catch(err => {
    console.warn('MongoDB connection failed - running without database features');
    console.warn('Error:', err.message);
});
