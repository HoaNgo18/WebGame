import mongoose from 'mongoose';
import config from '../config.js';

export async function connectDB() {
    await mongoose.connect(config.MONGODB_URI);
}

export async function disconnectDB() {
    try {
        await mongoose.disconnect();
    } catch (error) {
    }
}

export default mongoose;
