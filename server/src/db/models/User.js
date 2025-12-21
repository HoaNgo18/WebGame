import { mongoose } from '../db/mongo.js';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        minlength: 3,
        maxlength: 20,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },

    // Profile
    displayName: {
        type: String,
        default: function () { return this.username; }
    },
    avatar: {
        type: String,
        default: 'default'
    },
    skin: {
        type: String,
        default: 'default'
    },

    // Stats
    stats: {
        gamesPlayed: { type: Number, default: 0 },
        wins: { type: Number, default: 0 },
        kills: { type: Number, default: 0 },
        deaths: { type: Number, default: 0 },
        totalXP: { type: Number, default: 0 },
        highestKillStreak: { type: Number, default: 0 }
    },

    // Economy
    coins: { type: Number, default: 0 },

    // Inventory
    unlockedSkins: [{ type: String }],

    // Timestamps
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Hash password before save
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Public profile
userSchema.methods.toPublicJSON = function () {
    return {
        id: this._id,
        username: this.username,
        displayName: this.displayName,
        avatar: this.avatar,
        skin: this.skin,
        stats: this.stats,
        coins: this.coins
    };
};

export const User = mongoose.model('User', userSchema);
