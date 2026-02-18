import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Society from './models/Society.js';
import Tower from './models/Tower.js';

dotenv.config();

async function checkSociety() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Check all societies
    const societies = await Society.find();
    console.log('\n📋 All Societies:');
    societies.forEach((s) => {
      console.log(`${s.name}: ${s._id}`);
    });

    // Check which towers belong to which society
    const towers = await Tower.find().populate('society', 'name');
    console.log('\n📋 Towers by Society:');
    towers.forEach((t) => {
      console.log(`Tower ${t.name}: Society=${t.society?.name || 'NULL'}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

checkSociety();
