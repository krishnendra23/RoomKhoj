import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDB, disconnectDB } from '../config/db.js';
import { env } from '../config/env.js';
import app from '../app.js';
import { seedLocalities, seedAdminUser, seedPilotListings } from './seedData.js';

/**
 * Local development preview runner backed by a genuine local MongoDB instance (mongodb-memory-server).
 * For production or persistent development, configure MONGO_URI in server/.env and run `npm start`.
 */
async function startMemoryDev() {
  if (env.isProduction) {
    throw new Error('In-memory MongoDB runner cannot be used in production.');
  }

  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  console.log('[RoomKhoj Dev] Started local ephemeral MongoDB instance for preview.');

  await connectDB(uri);
  await seedLocalities();
  const admin = await seedAdminUser();
  await seedPilotListings(admin);
  console.log('[RoomKhoj Dev] Seeded Prayagraj localities, admin (9999999999 / Admin@1234), and pilot listings.');

  const server = app.listen(env.port, () => {
    console.log(`[RoomKhoj Dev API] Listening on http://localhost:${env.port}`);
  });

  const shutdown = async () => {
    server.close(async () => {
      await disconnectDB();
      await mongod.stop();
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startMemoryDev().catch((err) => {
  console.error('[RoomKhoj Dev] Failed:', err);
  process.exit(1);
});
