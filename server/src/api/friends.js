import { User } from '../db/models/User.js';

export const FriendsController = {
    // Send a friend request
    sendRequest: async (req, res) => {
        try {
            const { targetUsername } = req.body;
            const requesterId = req.user.userId;

            if (!targetUsername) {
                return res.status(400).json({ error: 'Username is required' });
            }

            const requester = await User.findById(requesterId);
            const target = await User.findOne({ username: targetUsername });

            if (!target) {
                return res.status(404).json({ error: 'User not found' });
            }

            if (requester.username === target.username) {
                return res.status(400).json({ error: 'Cannot add yourself' });
            }

            // Check if already friends or pending
            const existingFriendship = requester.friends.find(f => f.user.toString() === target._id.toString());

            if (existingFriendship) {
                if (existingFriendship.status === 'accepted') {
                    return res.status(400).json({ error: 'Already friends' });
                }
                if (existingFriendship.status === 'pending') {
                    return res.status(400).json({ error: 'Request already sent' });
                }
                if (existingFriendship.status === 'blocked') {
                    return res.status(400).json({ error: 'Cannot add this user' });
                }
            }

            // Check if target has blocked requester
            const targetFriendship = target.friends.find(f => f.user.toString() === requester._id.toString());
            if (targetFriendship && targetFriendship.status === 'blocked') {
                return res.status(400).json({ error: 'Cannot add this user' });
            }

            // If target already sent a request, accept it automatically
            if (targetFriendship && targetFriendship.status === 'pending') {
                // Update both to accepted
                existingFriendship.status = 'accepted';
                targetFriendship.status = 'accepted';
                await requester.save();
                await target.save();
                return res.json({ message: 'Friend request accepted', status: 'accepted' });
            }

            // Add pending request to target's list (Wait, usually request puts 'pending' on both or 'incoming'/'outgoing'?)
            // Implementation: 
            // Requester: friends list entry { user: target, status: 'requested' } (Optional, but good for UI)
            // Target: friends list entry { user: requester, status: 'pending' }

            // Simplified: 
            // Requester adds Target with status 'requested'
            // Target adds Requester with status 'pending'

            // Checking my schema design: status: 'pending' | 'accepted' | 'blocked'
            // I should add 'requested' to schema or handle logic purely by who initiated.
            // Let's stick to standard social logic:
            // Requester sees: "Pending (Outgoing)"
            // Target sees: "Pending (Incoming)"

            // Update Schema enum needed? 'pending' can cover 'incoming', maybe 'sent' for outgoing?
            // Let's use 'sent' and 'pending' (received).
            // Actually, the schema I wrote has: ['pending', 'accepted', 'blocked']
            // Let's strictly define: 
            // 'pending' = Incoming request (waiting for my approval)
            // 'sent' = Outgoing request (waiting for their approval) -> Need to update schema or just use 'pending' implies incoming?
            // If I only use 'pending', how do I distinguish? 
            // Usually: 
            // Entry in A's list: { user: B, status: 'sent' }
            // Entry in B's list: { user: A, status: 'pending' }

            // RE-EVALUATING SCHEMA: 
            // I should update schema to include 'sent'.

            // For now, let's assume I meant to add 'sent'. I will update schema in next step if needed or just use strings. Mongoose enum validation will fail if I don't.
            // Let's stick to 'pending' as INCOMING. 
            // How to track outgoing? 
            // Option A: Update schema to allow 'sent'.
            // Option B: Only store on target. Query all users where friends.user == me AND status == 'pending'. (Slow)

            // Decision: Update schema to include 'sent'.

            // Update Requester
            requester.friends.push({ user: target._id, status: 'sent' });
            await requester.save();

            // Update Target
            target.friends.push({ user: requester._id, status: 'pending' });
            await target.save();

            res.json({ message: 'Friend request sent' });

        } catch (err) {
            console.error('Send Request Error:', err);
            res.status(500).json({ error: 'Server error' });
        }
    },

    // Accept a friend request
    acceptRequest: async (req, res) => {
        try {
            const { requesterId } = req.body;
            const userId = req.user.userId;

            const user = await User.findById(userId);
            const requester = await User.findById(requesterId);

            if (!user || !requester) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Find the pending request
            const userFriendship = user.friends.find(f => f.user.toString() === requesterId && f.status === 'pending');
            if (!userFriendship) {
                return res.status(400).json({ error: 'No pending request found' });
            }

            // Find the sent request
            const requesterFriendship = requester.friends.find(f => f.user.toString() === userId && f.status === 'sent');

            // Update statuses
            userFriendship.status = 'accepted';
            if (requesterFriendship) {
                requesterFriendship.status = 'accepted';
            } else {
                // If missing for some reason, add it
                requester.friends.push({ user: userId, status: 'accepted' });
            }

            await user.save();
            await requester.save();

            res.json({ message: 'Friend request accepted' });

        } catch (err) {
            console.error('Accept Request Error:', err);
            res.status(500).json({ error: 'Server error' });
        }
    },

    // Reject a friend request
    rejectRequest: async (req, res) => {
        try {
            const { requesterId } = req.body;
            const userId = req.user.userId;

            const user = await User.findById(userId);
            const requester = await User.findById(requesterId);

            if (user) {
                user.friends = user.friends.filter(f => !(f.user.toString() === requesterId && f.status === 'pending'));
                await user.save();
            }

            if (requester) {
                requester.friends = requester.friends.filter(f => !(f.user.toString() === userId && f.status === 'sent'));
                await requester.save();
            }

            res.json({ message: 'Friend request rejected' });

        } catch (err) {
            console.error('Reject Request Error:', err);
            res.status(500).json({ error: 'Server error' });
        }
    },

    // Remove a friend
    removeFriend: async (req, res) => {
        try {
            const { friendId } = req.body;
            const userId = req.user.userId;

            const user = await User.findById(userId);
            const friend = await User.findById(friendId);

            if (user) {
                user.friends = user.friends.filter(f => f.user.toString() !== friendId);
                await user.save();
            }

            if (friend) {
                friend.friends = friend.friends.filter(f => f.user.toString() !== userId);
                await friend.save();
            }

            res.json({ message: 'Friend removed' });

        } catch (err) {
            console.error('Remove Friend Error:', err);
            res.status(500).json({ error: 'Server error' });
        }
    },

    // Get friends list
    getFriends: async (req, res) => {
        try {
            const userId = req.user.userId;
            const user = await User.findById(userId).populate('friends.user', 'username displayName avatar stats status');

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Map to clean format
            const friends = user.friends.map(f => {
                // Handle case where user might be deleted
                if (!f.user) return null;

                return {
                    id: f.user._id,
                    username: f.user.username,
                    displayName: f.user.displayName,
                    avatar: f.user.avatar,
                    status: f.status, // 'accepted', 'pending', 'sent'
                    isOnline: false // Offline by default, will be enriched by Socket/WorldManager if needed, or client checks presence
                };
            }).filter(f => f !== null);

            res.json({ friends });

        } catch (err) {
            console.error('Get Friends Error:', err);
            res.status(500).json({ error: 'Server error' });
        }
    }
};
