import express from 'express';
import { AuthController, authMiddleware } from './AuthController.js';

import { FriendsController } from './friends.js';

const router = express.Router();

// Public routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Protected routes
router.get('/profile', authMiddleware, AuthController.getProfile);
router.put('/profile', authMiddleware, AuthController.updateProfile);

// Friend routes
router.post('/friends/request', authMiddleware, FriendsController.sendRequest);
router.post('/friends/accept', authMiddleware, FriendsController.acceptRequest);
router.post('/friends/reject', authMiddleware, FriendsController.rejectRequest);
router.post('/friends/remove', authMiddleware, FriendsController.removeFriend);
router.get('/friends', authMiddleware, FriendsController.getFriends);

export { router as authRoutes };
