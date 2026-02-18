import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Society from './models/Society.js';
import Tower from './models/Tower.js';
import Flat from './models/Flat.js';
import Resident from './models/Resident.js';
import Maintenance from './models/Maintenance.js';

dotenv.config();

async function checkMaintenance() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    const records = await Maintenance.find()
      .populate('society', 'name')
      .populate('flat', 'flatNo tower')
      .populate('resident', 'fullName mobile');

    console.log('\n📋 Maintenance Records:');
    records.forEach((r, i) => {
      console.log(`\n${i + 1}. ID: ${r._id}`);
      console.log(`   Society: ${r.society?.name || 'NULL'} (ID: ${r.society?._id || 'NULL'})`);
      console.log(`   Flat: ${r.flat?.flatNo} (Tower ID: ${r.flat?.tower})`);
      console.log(`   Resident: ${r.resident?.fullName || 'NULL'}`);
      console.log(`   Amount: ${r.totalAmount}`);
    });

    console.log(`\n✓ Total records: ${records.length}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

checkMaintenance();
