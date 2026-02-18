import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Society from './models/Society.js';
import Tower from './models/Tower.js';

dotenv.config();

async function checkTowers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    const towers = await Tower.find().populate('society', 'name');

    console.log('\n📋 Towers:');
    towers.forEach((t) => {
      console.log(`Tower ${t.name}: Society=${t.society?.name || 'NULL'} (${t.society?._id})`);
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

checkTowers();
