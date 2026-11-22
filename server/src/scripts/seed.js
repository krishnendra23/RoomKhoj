import { connectDB, disconnectDB } from '../config/db.js';
import { seedLocalities, seedAdminUser, seedPilotListings } from './seedData.js';

async function run() {
  const withSampleListings = process.argv.includes('--with-samples');
  try {
    await connectDB();
    await seedLocalities();
    const admin = await seedAdminUser();
    console.log(`[Seed] Prayagraj localities ensured.`);
    console.log(`[Seed] Admin account ready (mobile: ${admin.mobile}).`);

    if (withSampleListings) {
      await seedPilotListings(admin);
      console.log('[Seed] Sample Prayagraj pilot listings inserted (if collection was empty).');
    } else {
      console.log(
        '[Seed] Tip: Pass --with-samples (`npm run seed -- --with-samples`) to also seed initial Prayagraj demo listings.'
      );
    }
  } catch (err) {
    console.error('[Seed] Error:', err.message);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}

run();
