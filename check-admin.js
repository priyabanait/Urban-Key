import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Manager from './models/Manager.js';
import Society from './models/Society.js';

dotenv.config();

async function checkAdminUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    const admins = await Manager.find().populate('society', 'name');

    console.log('\n📋 Managers:');
    admins.forEach((u) => {
      console.log(`Manager: ${u.name} (${u.email}) - ${u.role}`);
      console.log(`  - ID: ${u._id}`);
      console.log(`  - societyId: ${u.society?._id}`);
      console.log(`  - society: ${u.society?.name}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

checkAdminUser();
