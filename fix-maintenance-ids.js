import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Maintenance from './models/Maintenance.js';

dotenv.config();

async function fixMaintenanceSocietyIds() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // The invalid society ID that's currently in maintenance records
    const invalidId = '507f1f77bcf86cd799439011';
    
    // The correct society ID (Sharada Nagar)
    const correctSocietyId = '69901e38e4343ed761e92c81';

    // Update all maintenance records with the invalid society ID
    const result = await Maintenance.updateMany(
      { society: mongoose.Types.ObjectId.createFromHexString(invalidId) },
      { society: mongoose.Types.ObjectId.createFromHexString(correctSocietyId) }
    );

    console.log(`\n✓ Updated ${result.modifiedCount} maintenance records`);
    console.log(`Old society ID: ${invalidId}`);
    console.log(`New society ID: ${correctSocietyId}`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

fixMaintenanceSocietyIds();
