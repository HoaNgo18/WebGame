import { Server } from './core/Server.js';
import express from 'express';
import cors from 'cors';
import { connectDB } from './db/mongo.js';
import authRouter from './api/auth.js';
import friendRouter from './api/friendRoutes.js';
import config from './config.js';
import { User } from './db/models/User.model.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// REST API routes
app.use('/api/auth', authRouter);
app.use('/api/friends', friendRouter);

// Leaderboard route
app.get('/api/leaderboard', async (req, res) => {
    try {
        const { type = 'endless', limit = 10 } = req.query;
        const limitNum = parseInt(limit) || 10;

        let sortField, selectFields;

        if (type === 'arena') {
            sortField = { arenaWins: -1 };
            selectFields = 'username displayName tag arenaWins arenaTop2 arenaTop3';
        } else {
            // Default to endless mode
            sortField = { highScore: -1 };
            selectFields = 'username displayName tag highScore totalKills totalDeaths';
        }

        const topPlayers = await User.find()
            .sort(sortField)
            .limit(limitNum)
            .select(selectFields);

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
