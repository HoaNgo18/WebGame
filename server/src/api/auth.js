import express from 'express';
import jwt from 'jsonwebtoken';
// Lưu ý: Đường dẫn này đã được sửa để đúng với cấu trúc models
import { User } from '../db/models/User.model.js';
import config from '../config.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, displayName } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields required' });
        }

        // Check if user exists
        const existingUser = await User.findOne({
            $or: [{ username }, { email }]
        });

        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Create user
        const user = new User({
            username,
            email,
            password,
            displayName: displayName || username // Default to username if empty
        });

        await user.save();

        // Generate token
        const token = jwt.sign({ id: user._id }, config.JWT_SECRET, {
            expiresIn: '7d'
        });

        res.status(201).json({
            token,
            user: {
                id: user._id,
                username: user.username,
                displayName: user.displayName, // Return displayName
                email: user.email,
                highScore: user.highScore,
                // --- Cập nhật thêm ---
                skins: user.skins,
                equippedSkin: user.equippedSkin
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password, displayName } = req.body;

        // Find user
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update displayName ONLY if provided AND non-empty
        const trimmedDisplayName = displayName ? displayName.trim() : '';
        if (trimmedDisplayName && trimmedDisplayName !== user.displayName) {
            user.displayName = trimmedDisplayName;
            await user.save();
        }

        // Determine in-game name:
        // - If user has displayName (in DB, not empty) → use displayName
        // - Otherwise → use username
        const effectiveDisplayName = (user.displayName && user.displayName.trim())
            ? user.displayName
            : null;

        // Generate token
        const token = jwt.sign({ id: user._id }, config.JWT_SECRET, {
            expiresIn: '7d'
        });

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                displayName: effectiveDisplayName, // Can be null if not set
                email: user.email,
                highScore: user.highScore || 0,
                coins: user.coins || 0,
                totalKills: user.totalKills || 0,
                totalDeaths: user.totalDeaths || 0,
                skins: user.skins,
                equippedSkin: user.equippedSkin || 'default',
                arenaWins: user.arenaWins || 0,
                arenaTop2: user.arenaTop2 || 0,
                arenaTop3: user.arenaTop3 || 0
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get profile (protected route)
router.get('/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, config.JWT_SECRET);
        // select('-password') sẽ tự động lấy tất cả các trường còn lại, bao gồm cả equippedSkin mới thêm
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

// Update profile (display name)
router.post('/update-profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, config.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { displayName } = req.body;

        if (displayName !== undefined) {
            user.displayName = displayName.trim();
            await user.save();
        }

        res.json({
            success: true,
            user: {
                displayName: user.displayName
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Change password
router.post('/change-password', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, config.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { currentPassword, newPassword } = req.body;

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Validate new password
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters' });
        }

        // Update password (will be hashed by pre-save hook)
        user.password = newPassword;
        await user.save();

        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
});

// Delete account
router.delete('/delete-account', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, config.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Delete the user account
        await User.findByIdAndDelete(decoded.id);

        console.log(`[Auth] Account deleted: ${user.username}`);
        res.json({ success: true, message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ error: 'Failed to delete account' });
    }
});

export default router;
