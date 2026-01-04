import express from 'express';
import { FriendsController } from './friends.js';
import { authMiddleware } from './AuthController.js';

const router = express.Router();

router.post('/request', authMiddleware, FriendsController.sendRequest);
router.post('/accept', authMiddleware, FriendsController.acceptRequest);
router.post('/reject', authMiddleware, FriendsController.rejectRequest);
router.post('/remove', authMiddleware, FriendsController.removeFriend);
router.get('/', authMiddleware, FriendsController.getFriends);

export default router;
