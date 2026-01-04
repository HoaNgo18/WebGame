import jwt from 'jsonwebtoken';
import { User } from '../db/models/User.model.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES = '7d';

export class AuthController {
    static async register(req, res) {
        try {
            const { username, email, password } = req.body;

            // Validate
            if (!username || !email || !password) {
                return res.status(400).json({ error: 'All fields required' });
            }

            // Check if exists
            const existingUser = await User.findOne({
                $or: [{ email }, { username }]
            });

            if (existingUser) {
                return res.status(400).json({ error: 'Username or email already exists' });
            }

            // Create user
            const user = new User({ username, email, password });
            await user.save();

            // Generate token
            const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

            res.status(201).json({
                token,
                user: user.toPublicJSON()
            });
        } catch (error) {
            console.error('Register error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }

    static async login(req, res) {
        try {
            const { email, password } = req.body;

            // Find user
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Check password
            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Update last login
            user.lastLogin = new Date();
            await user.save();

            // Generate token
            const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

            res.json({
                token,
                user: user.toPublicJSON()
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }

    static async getProfile(req, res) {
        try {
            const user = await User.findById(req.userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json({ user: user.toPublicJSON() });
        } catch (error) {
            console.error('Profile error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }

    static async updateProfile(req, res) {
        try {
            const { displayName, skin } = req.body;

            const user = await User.findById(req.userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            if (displayName) user.displayName = displayName;
            if (skin && user.unlockedSkins.includes(skin)) {
                user.skin = skin;
            }

            await user.save();

            res.json({ user: user.toPublicJSON() });
        } catch (error) {
            console.error('Update error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }

    static async updateStats(userId, stats) {
        try {
            const update = {};
            if (stats.gamesPlayed) update['stats.gamesPlayed'] = stats.gamesPlayed;
            if (stats.wins) update['stats.wins'] = stats.wins;
            if (stats.kills) update['stats.kills'] = stats.kills;
            if (stats.deaths) update['stats.deaths'] = stats.deaths;
            if (stats.xp) update['stats.totalXP'] = stats.xp;
            if (stats.coins) update['coins'] = stats.coins;

            await User.findByIdAndUpdate(userId, { $inc: update });
        } catch (error) {
            console.error('Stats update error:', error);
        }
    }

    static async updateSoundSettings(req, res) {
        try {
            const { masterVolume, musicVolume, sfxVolume } = req.body;

            const user = await User.findById(req.userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Update sound settings
            if (masterVolume !== undefined) user.soundSettings.masterVolume = Math.max(0, Math.min(1, masterVolume));
            if (musicVolume !== undefined) user.soundSettings.musicVolume = Math.max(0, Math.min(1, musicVolume));
            if (sfxVolume !== undefined) user.soundSettings.sfxVolume = Math.max(0, Math.min(1, sfxVolume));

            await user.save();

            res.json({ soundSettings: user.soundSettings });
        } catch (error) {
            console.error('Sound settings update error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }
}

// Auth middleware
export function authMiddleware(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}
