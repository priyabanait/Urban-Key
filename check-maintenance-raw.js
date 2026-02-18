import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Maintenance from './models/Maintenance.js';

dotenv.config();

async function checkMaintenanceRaw() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    const records = await Maintenance.find().select('_id flat resident totalAmount society').limit(5);

    console.log('\n📋 Raw Maintenance Data (first 5):');
    records.forEach((r) => {
      console.log(`Record ${r._id}:`);
      console.log(`  - flat: ${r.flat}`);
      console.log(`  - resident: ${r.resident}`);
      console.log(`  - society: ${r.society}`);
      console.log(`  - totalAmount: ${r.totalAmount}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

checkMaintenanceRaw();
