import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import app from './app.js';

async function startServer() {
  try {
    await connectDB();

    const server = app.listen(env.port, () => {
      console.log(`[RoomKhoj API] Listening on port ${env.port} (${env.nodeEnv})`);
    });

    const shutdown = async (signal) => {
      console.log(`\n[RoomKhoj API] Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await disconnectDB();
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    console.error('[RoomKhoj API] Failed to start:', err.message);
    process.exit(1);
  }
}

startServer();
