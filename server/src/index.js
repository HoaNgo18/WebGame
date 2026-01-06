import { Server } from './core/Server.js';
import express from 'express';
import cors from 'cors';
import { connectDB } from './db/mongo.js';
import authRouter from './api/auth.js';
import friendRouter from './api/friendRoutes.js';
import config from './config.js';
import { User } from './db/models/User.model.js';

const app = express();

// Middleware - CORS with proper configuration for production
const corsOptions = {
    origin: config.NODE_ENV === 'production'
        ? config.CLIENT_URL
        : true, // Allow all in development
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

// Simple rate limiting middleware (no external dependency)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 100; // 100 requests per minute

const rateLimiter = (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    if (!rateLimitMap.has(ip)) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return next();
    }

    const record = rateLimitMap.get(ip);
    if (now > record.resetTime) {
        record.count = 1;
        record.resetTime = now + RATE_LIMIT_WINDOW;
        return next();
    }

    record.count++;
    if (record.count > RATE_LIMIT_MAX) {
        return res.status(429).json({ error: 'Too many requests, please try again later' });
    }

    next();
};

// Apply rate limiting to API routes
app.use('/api/', rateLimiter);

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
