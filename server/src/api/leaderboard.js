import express from 'express';
import { UserService } from '../services/UserService.js';

const router = express.Router();

// Get leaderboard
router.get('/', async (req, res) => {
    try {
        const { type = 'kills', limit = 10 } = req.query;
        const leaderboard = await UserService.getLeaderboard(type, parseInt(limit));

        res.json({
            type,
            players: leaderboard.map((user, index) => ({
                rank: index + 1,
                username: user.username,
                displayName: user.displayName,
                avatar: user.avatar,
                kills: user.stats.kills,
                wins: user.stats.wins,
                xp: user.stats.totalXP
            }))
        });
    } catch (error) {
        console.error('Leaderboard error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export { router as leaderboardRoutes };
