import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Resident from './models/Resident.js';
import Flat from './models/Flat.js';
import Tower from './models/Tower.js';

dotenv.config();

const fixRohitFlat = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected\n');

    // Find Rohit
    const rohit = await Resident.findOne({ fullName: /rohit/i });
    if (!rohit) {
      console.log('❌ Rohit not found');
      process.exit(1);
    }

    console.log('Before fix:');
    console.log(`  Resident: ${rohit.fullName}`);
    console.log(`  flatNumber: ${rohit.flatNumber}`);

    // Find the actual flat Rohit is in
    const actualFlat = await Flat.findOne({ resident: rohit._id }).populate('tower');
    if (!actualFlat) {
      console.log('❌ Rohit not linked to any flat');
      process.exit(1);
    }

    console.log(`  Actual flat in DB: ${actualFlat.flatNo} (Tower: ${actualFlat.tower.name})`);

    // Update the resident with correct flatNumber
    rohit.flatNumber = actualFlat.flatNo;
    await rohit.save();

    console.log('\nAfter fix:');
    console.log(`  Resident: ${rohit.fullName}`);
    console.log(`  flatNumber: ${rohit.flatNumber}`);

    console.log(`\n✅ Rohit Sharma's flat number corrected from "4" to "${actualFlat.flatNo}"`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

fixRohitFlat();
