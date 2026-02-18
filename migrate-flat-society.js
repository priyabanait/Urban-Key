import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Society from './models/Society.js';
import Tower from './models/Tower.js';
import Flat from './models/Flat.js';

dotenv.config();

async function migrateFlats() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Get all flats with their tower info
    const flats = await Flat.find().populate('tower');

    let updateCount = 0;
    let skipCount = 0;

    for (const flat of flats) {
      if (flat.society) {
        skipCount++;
        continue;
      }

      if (flat.tower && flat.tower.society) {
        await Flat.findByIdAndUpdate(flat._id, {
          society: flat.tower.society
        });
        updateCount++;
        console.log(`✓ Updated flat ${flat.flatNo} with society ${flat.tower.society}`);
      } else {
        console.log(`⚠️ Flat ${flat.flatNo} has no tower or tower has no society`);
      }
    }

    console.log(`\n✓ Migration complete!`);
    console.log(`  - Updated: ${updateCount}`);
    console.log(`  - Skipped (already set): ${skipCount}`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

migrateFlats();
