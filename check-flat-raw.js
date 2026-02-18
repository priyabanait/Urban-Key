import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Flat from './models/Flat.js';

dotenv.config();

async function checkFlatRaw() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    const flats = await Flat.find().select('flatNo tower society').limit(5);

    console.log('\n📋 Raw Flat Data (first 5):');
    flats.forEach((f) => {
      console.log(`Flat ${f.flatNo}:`);
      console.log(`  - tower: ${f.tower}`);
      console.log(`  - society: ${f.society}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

checkFlatRaw();
