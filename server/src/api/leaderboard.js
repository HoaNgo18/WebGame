import express from 'express';
import { User } from '../db/models/User.model.js';

const router = express.Router();

// Get leaderboard
router.get('/', async (req, res) => {
    try {
        const { type = 'highScore', limit = 10 } = req.query;

        let sortField;
        let scoreField;
        switch (type) {
            case 'highScore':
            case 'endless':
                sortField = 'highScore';
                scoreField = 'highScore';
                break;
            case 'arenaWins':
            case 'arena':
                sortField = 'arenaWins';
                scoreField = 'arenaWins';
                break;
            default:
                sortField = 'highScore';
                scoreField = 'highScore';
        }

        const users = await User.find({ [sortField]: { $gt: 0 } })
            .sort({ [sortField]: -1 })
            .limit(parseInt(limit))
            .select('username displayName highScore arenaWins');

        res.json({
            type,
            players: users.map((user, index) => ({
                rank: index + 1,
                username: user.displayName || user.username,
                score: user[scoreField]
            }))
        });
    } catch (error) {
        console.error('Leaderboard error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export { router as leaderboardRoutes };
