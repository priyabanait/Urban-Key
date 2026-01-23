import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Manager from './models/Manager.js';
import Society from './models/Society.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    // Create default society
    const existingSociety = await Society.findOne({ name: 'Default Society' });
    let society;
    
    if (!existingSociety) {
      society = await Society.create({
        name: 'Default Society',
        address: {
          street: '123 Main Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400001',
          country: 'India'
        },
        contactInfo: {
          email: 'admin@urbankey.com',
          phone: '+91 98765 43210'
        },
        status: 'active'
      });
      console.log('✅ Default society created');
    } else {
      society = existingSociety;
      console.log('ℹ️  Default society already exists');
    }

    // Define default managers
    const defaultManagers = [
      {
        name: 'Admin',
        email: 'admin@urbankey.com',
        password: 'admin123',
        mobile: '+91 98765 43210',
        role: 'super_admin',
        department: 'Administration',
        society: society._id,
        status: 'active'
      },
      {
        name: 'Manager',
        email: 'manager@urbankey.com',
        password: 'manager123',
        mobile: '+91 98765 43211',
        role: 'society_admin',
        department: 'Society Operations',
        society: society._id,
        status: 'active'
      },
      {
        name: 'Finance',
        email: 'finance@24carrental.com',
        password: 'finance123',
        mobile: '+91 98765 43212',
        role: 'finance_admin',
        department: 'Finance',
        society: society._id,
        status: 'active'
      }
    ];

    // Create managers if they don't exist
    for (const managerData of defaultManagers) {
      const existingManager = await Manager.findOne({ email: managerData.email });
      
      if (!existingManager) {
        await Manager.create(managerData);
        console.log(`✅ Manager created: ${managerData.email}`);
      } else {
        console.log(`ℹ️  Manager already exists: ${managerData.email}`);
      }
    }

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📋 Default Login Credentials:');
    console.log('================================');
    defaultManagers.forEach(m => {
      console.log(`${m.role.toUpperCase()}: ${m.email} / ${m.password}`);
    });
    console.log('================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
