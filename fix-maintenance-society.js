import mongoose from 'mongoose';
import Maintenance from './models/Maintenance.js';
import Flat from './models/Flat.js';
import dotenv from 'dotenv';

dotenv.config();

async function fixMaintenanceSociety() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all maintenance records with null society
    const records = await Maintenance.find({ society: null }).populate('flat');
    console.log(`Found ${records.length} maintenance records with null society`);

    if (records.length === 0) {
      console.log('No records to fix!');
      await mongoose.disconnect();
      return;
    }

    let updated = 0;
    let failed = 0;

    for (const record of records) {
      try {
        if (record.flat && record.flat.society) {
          // Use the flat's society
          record.society = record.flat.society;
          await record.save();
          updated++;
          console.log(`✓ Fixed record ${record._id}`);
        } else {
          console.log(`✗ Record ${record._id} has no flat or flat has no society`);
          failed++;
        }
      } catch (err) {
        console.error(`✗ Error fixing record ${record._id}:`, err.message);
        failed++;
      }
    }

    console.log(`\n=== SUMMARY ===`);
    console.log(`Updated: ${updated}`);
    console.log(`Failed: ${failed}`);

    await mongoose.disconnect();
    console.log('Done!');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

fixMaintenanceSociety();
