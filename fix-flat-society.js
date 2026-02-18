import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Flat from './models/Flat.js';
import Maintenance from './models/Maintenance.js';

dotenv.config();

async function fixFlatSociety() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Get the correct society IDs
    const sharadaSociety = await mongoose.connection.collection('societies').findOne({ name: 'Sharada Nagar' });
    
    const oldSocietyId = '69734f58b32858813927cd65';  // The invalid ID currently in flats
    const correctSocietyId = sharadaSociety._id.toString();

    console.log(`\nFixing invalid society ID: ${oldSocietyId}`);
    console.log(`New society ID (Sharada Nagar): ${correctSocietyId}`);

    // Update all flats with the invalid society ID
    const flatResult = await Flat.updateMany(
      { society: mongoose.Types.ObjectId.createFromHexString(oldSocietyId) },
      { society: sharadaSociety._id }
    );

    console.log(`\n✓ Updated ${flatResult.modifiedCount} flats`);

    // Also update maintenance records  
    const maintenanceResult = await Maintenance.updateMany(
      { society: mongoose.Types.ObjectId.createFromHexString(oldSocietyId) },
      { society: sharadaSociety._id }
    );

    console.log(`✓ Updated ${maintenanceResult.modifiedCount} maintenance records`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

fixFlatSociety();
