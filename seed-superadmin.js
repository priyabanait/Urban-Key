/**
 * Seed only the super admin user (admin@urbankey.com / admin123)
 * Run: node seed-superadmin.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Manager from './models/Manager.js';
import Society from './models/Society.js';
import City from './models/City.js';

dotenv.config();

async function seedSuperAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    let city = await City.findOne({});
    if (!city) {
      city = await City.create({ name: 'Mumbai', state: 'Maharashtra', country: 'India', isActive: true });
      console.log('✅ City created');
    }

    let society = await Society.findOne({ city: city._id });
    if (!society) {
      society = await Society.create({ name: 'Default Society', code: 'DEFAULT', city: city._id, isActive: true });
      console.log('✅ Society created');
    }

    const existing = await Manager.findOne({ email: 'admin@urbankey.com' });
    if (existing) {
      existing.role = 'super_admin';
      existing.password = 'admin123';
      existing.society = society._id;
      existing.status = 'active';
      await existing.save();
      console.log('✅ Super admin updated: admin@urbankey.com');
    } else {
      await Manager.create({
        name: 'Admin',
        email: 'admin@urbankey.com',
        password: 'admin123',
        role: 'super_admin',
        society: society._id,
        status: 'active'
      });
      console.log('✅ Super admin created: admin@urbankey.com');
    }

    console.log('\n🔐 Super Admin Login: admin@urbankey.com / admin123\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

seedSuperAdmin();
