import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Resident from './models/Resident.js';
import Flat from './models/Flat.js';
import Society from './models/Society.js';
import Tower from './models/Tower.js';

dotenv.config();

const linkResidentToFlat = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected\n');

    // Find city and then the society by city _id
    const City = (await import('./models/City.js')).default;
    const city = await City.findOne({ name: /bangalore/i });
    if (!city) {
      console.log('❌ City bangalore not found');
      process.exit(1);
    }

    const society = await Society.findOne({ name: /prestige towers/i, city: city._id });
    if (!society) {
      console.log('❌ Prestige Towers society not found');
      process.exit(1);
    }

    console.log(`📍 Found Society: ${society.name}`);
    console.log(`   ID: ${society._id}\n`);

    // Get Rohit Sharma
    const rohit = await Resident.findOne({ fullName: /rohit/i });
    
    if (!rohit) {
      console.log('❌ Rohit Sharma not found');
      process.exit(1);
    }

    console.log(`👤 Found Resident: ${rohit.fullName}`);
    console.log(`   Current Flat ID: ${rohit.flatId || 'Not set'}\n`);

    // Get flat 101 from Tower A wing in Prestige Towers
    const flat = await Flat.findOne({ 
      flatNo: '101',
      society: society._id 
    }).populate('tower');

    if (!flat) {
      console.log('❌ Flat 101 not found in Prestige Towers');
      process.exit(1);
    }

    console.log(`🏠 Found Flat: ${flat.flatNo}`);
    console.log(`   Tower: ${flat.tower.name}`);
    console.log(`   Floor: ${flat.floor}\n`);

    // Link resident to flat
    rohit.flatId = flat._id;
    rohit.flatNumber = flat.flatNo;
    rohit.societyId = society._id;
    rohit.societyName = society.name;
    rohit.status = 'Active'; // Make sure status is set

    await rohit.save();

    // Also set the resident on the flat
    flat.resident = rohit._id;
    await flat.save();

    console.log(`✅ Successfully linked ${rohit.fullName} to Flat ${flat.flatNo}`);
    console.log(`   Resident ID: ${rohit._id}`);
    console.log(`   Flat ID: ${flat._id}`);
    console.log(`   Society ID: ${society._id}\n`);

    // Verify the link
    const updatedResident = await Resident.findById(rohit._id).populate('flatId');
    console.log(`✅ Verification:`);
    console.log(`   Resident: ${updatedResident.fullName}`);
    console.log(`   Flat: ${updatedResident.flatNumber}`);
    console.log(`   Society: ${updatedResident.societyName}`);

    await mongoose.connection.close();
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

linkResidentToFlat();
