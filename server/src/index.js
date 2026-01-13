import { Server } from './core/Server.js';
import express from 'express';
import cors from 'cors';
import { connectDB, disconnectDB } from './db/mongo.js';
import authRouter from './api/auth.js';
import friendRouter from './api/friendRoutes.js';
import { leaderboardRoutes } from './api/leaderboard.js';
import config from './config.js';

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

// Cleanup expired rate limit entries every minute (prevents memory leak)
setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of rateLimitMap) {
        if (now > record.resetTime) {
            rateLimitMap.delete(ip);
        }
    }
}, 60 * 1000);

// Apply rate limiting to API routes
app.use('/api/', rateLimiter);

// REST API routes
app.use('/api/auth', authRouter);
app.use('/api/friends', friendRouter);
app.use('/api/leaderboard', leaderboardRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});

// Start HTTP server
const PORT = process.env.PORT || config.HTTP_PORT || 8080;
const httpServer = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Start WebSocket game server attached to HTTP server
const gameServer = new Server(httpServer);
gameServer.start();
// console.log(`WebSocket game server started on port ${config.WS_PORT || 3000}`);

// Connect to MongoDB (optional for development)
connectDB().then(() => {
    console.log('MongoDB connected - database features enabled');
}).catch(err => {
    console.warn('MongoDB connection failed - running without database features');
    console.warn('Error:', err.message);
});

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);

    // Close HTTP server
    httpServer.close(() => {
        console.log('HTTP server closed');
    });

    // Close WebSocket server
    if (gameServer && gameServer.wss) {
        gameServer.wss.close(() => {
            console.log('WebSocket server closed');
        });
    }

    // Disconnect from MongoDB
    await disconnectDB();
    console.log('MongoDB disconnected');

    process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
