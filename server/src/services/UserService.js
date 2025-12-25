import { User } from '../db/models/User.js';

export class UserService {
    static async findById(id) {
        return await User.findById(id);
    }

    static async findByEmail(email) {
        return await User.findOne({ email });
    }

    static async findByUsername(username) {
        return await User.findOne({ username });
    }

    static async create(userData) {
        const user = new User(userData);
        await user.save();
        return user;
    }

    static async updateStats(userId, stats) {
        const update = { $inc: {} };

        if (stats.gamesPlayed) update.$inc['stats.gamesPlayed'] = stats.gamesPlayed;
        if (stats.wins) update.$inc['stats.wins'] = stats.wins;
        if (stats.kills) update.$inc['stats.kills'] = stats.kills;
        if (stats.deaths) update.$inc['stats.deaths'] = stats.deaths;
        if (stats.xp) update.$inc['stats.totalXP'] = stats.xp;
        if (stats.coins) update.$inc['coins'] = stats.coins;

        return await User.findByIdAndUpdate(userId, update, { new: true });
    }

    static async addCoins(userId, amount) {
        return await User.findByIdAndUpdate(
            userId,
            { $inc: { coins: amount } },
            { new: true }
        );
    }

    static async unlockSkin(userId, skinId) {
        return await User.findByIdAndUpdate(
            userId,
            { $addToSet: { unlockedSkins: skinId } },
            { new: true }
        );
    }

    static async getLeaderboard(type = 'kills', limit = 10) {
        let sortField;
        switch (type) {
            case 'kills': sortField = 'stats.kills'; break;
            case 'wins': sortField = 'stats.wins'; break;
            case 'xp': sortField = 'stats.totalXP'; break;
            default: sortField = 'stats.kills';
        }

        return await User.find()
            .sort({ [sortField]: -1 })
            .limit(limit)
            .select('username displayName avatar stats');
    }

    static async getPlayerRank(userId, type = 'kills') {
        const user = await User.findById(userId);
        if (!user) return null;

        let sortField;
        switch (type) {
            case 'kills': sortField = 'stats.kills'; break;
            case 'wins': sortField = 'stats.wins'; break;
            case 'xp': sortField = 'stats.totalXP'; break;
            default: sortField = 'stats.kills';
        }

        const rank = await User.countDocuments({
            [sortField]: { $gt: user.stats[type] || 0 }
        });

        return rank + 1;
    }
}
