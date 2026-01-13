import { Server } from './core/Server.js';
import express from 'express';
import cors from 'cors';
import { connectDB, disconnectDB } from './db/mongo.js';
import authRouter from './api/auth.js';
import friendRouter from './api/friendRoutes.js';
import { leaderboardRoutes } from './api/leaderboard.js';
import config from './config.js';

const app = express();


const corsOptions = {
    origin: config.NODE_ENV === 'production'
        ? config.CLIENT_URL
        : true, // Allow all in development
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());


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


setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of rateLimitMap) {
        if (now > record.resetTime) {
            rateLimitMap.delete(ip);
        }
    }
}, 60 * 1000);


app.use('/api/', rateLimiter);


app.use('/api/auth', authRouter);
app.use('/api/friends', friendRouter);
app.use('/api/leaderboard', leaderboardRoutes);


app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});


const PORT = process.env.PORT || config.HTTP_PORT || 8080;
const httpServer = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const gameServer = new Server(httpServer);
gameServer.start();

connectDB().catch(() => { });

const gracefulShutdown = async () => {
    httpServer.close();
    if (gameServer?.wss) gameServer.wss.close();
    await disconnectDB();

    process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
