import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Society from './models/Society.js';
import Tower from './models/Tower.js';
import Flat from './models/Flat.js';
import Resident from './models/Resident.js';
import Maintenance from './models/Maintenance.js';

dotenv.config();

async function verifyApi() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Simulate the API call with proper populate
    const records = await Maintenance.find()
      .populate({
        path: 'flat',
        select: 'flatNo tower',
        populate: {
          path: 'tower',
          select: 'name'
        }
      })
      .populate('resident', 'fullName email mobile')
      .populate('society', 'name')
      .limit(3);

    console.log('\n📋 API Response (Maintenance Records with Nested Populate):');
    records.forEach((r) => {
      console.log(`\nRecord ID: ${r._id}`);
      console.log(`  - Society: ${r.society?.name || 'N/A'}`);
      console.log(`  - Flat: ${r.flat?.flatNo}`);
      console.log(`  - Tower: ${r.flat?.tower?.name || 'N/A'}`);
      console.log(`  - Resident: ${r.resident?.fullName || 'N/A'}`);
      console.log(`  - Amount: ₹${r.totalAmount}`);
      console.log(`  - Status: ${r.paymentStatus}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

verifyApi();
