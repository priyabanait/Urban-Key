import mongoose from 'mongoose';
import dotenv from 'dotenv';
import City from './models/City.js';
import Society from './models/Society.js';

dotenv.config();

const seedSocieties = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    // Get all cities with societies
    const cities = await City.find({ isActive: true });

    if (cities.length === 0) {
      console.log('❌ No cities found. Please run seed-cities.js first');
      process.exit(1);
    }

    console.log(`📍 Found ${cities.length} cities\n`);

    for (const city of cities) {
      console.log(`Processing ${city.name.toUpperCase()}...`);
      
      if (!city.societies || city.societies.length === 0) {
        console.log(`   ⚠️  No societies found in ${city.name}, skipping\n`);
        continue;
      }

      for (const societyInfo of city.societies) {
        try {
          // Check if society already exists for this city by name
          let society = await Society.findOne({ 
            name: new RegExp(`^${societyInfo.name}$`, 'i'),
            city: city._id
          });

          if (!society) {
            society = await Society.create({
              name: societyInfo.name,
              code: societyInfo.code,
              city: city._id,
              isActive: societyInfo.isActive ?? true
            });
            console.log(`   ✅ Created society: ${society.name}`);
          } else {
            console.log(`   ℹ️  Society already exists: ${society.name}`);
          }
        } catch (err) {
          console.error(`   ❌ Error creating society ${societyInfo.name}:`, err.message);
        }
      }
      console.log();
    }

    // Verify all societies were created
    const totalSocieties = await Society.countDocuments();
    console.log(`✅ Total societies in database: ${totalSocieties}`);

    await mongoose.connection.close();
    console.log('✅ Seeding completed successfully!');
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

seedSocieties();
