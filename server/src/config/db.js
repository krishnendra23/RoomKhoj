import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB(uriOverride) {
  const uri = uriOverride || env.mongoUri;

  if (!uri) {
    throw new Error(
      'MONGO_URI is not configured. Set MONGO_URI in server/.env to connect to MongoDB Atlas or local MongoDB.'
    );
  }

  mongoose.set('strictQuery', true);

  const conn = await mongoose.connect(uri, {
    autoIndex: !env.isProduction,
    serverSelectionTimeoutMS: 10000,
  });

  console.log(`[RoomKhoj DB] Connected to MongoDB host: ${conn.connection.host}`);
  return conn;
}

export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
