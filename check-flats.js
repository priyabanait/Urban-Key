import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Society from './models/Society.js';
import Tower from './models/Tower.js';
import Flat from './models/Flat.js';

dotenv.config();

async function checkFlats() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    const flats = await Flat.find()
      .populate('society', 'name')
      .populate('tower', 'name');

    console.log('\n📋 Flats:');
    flats.forEach((f) => {
      console.log(`Flat ${f.flatNo}: Society=${f.society?.name || 'NULL'} (${f.society?._id}), Tower=${f.tower?.name}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

checkFlats();
