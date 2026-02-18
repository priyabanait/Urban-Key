import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Tower from './models/Tower.js';
import Flat from './models/Flat.js';
import Society from './models/Society.js';
import Resident from './models/Resident.js';

dotenv.config();

const checkPrestigeTowerData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected\n');

    // Get city and then Prestige Towers society by city _id
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

    // Get towers in this society
    const towers = await Tower.find({ society: society._id });
    console.log(`🏢 Towers in Prestige Towers: ${towers.length}`);
    towers.forEach(t => {
      console.log(`   - ${t.name} (ID: ${t._id})`);
    });

    // Get flats in each tower
    for (const tower of towers) {
      const flats = await Flat.find({ tower: tower._id });
      console.log(`\n🏠 Flats in Tower ${tower.name}: ${flats.length}`);
      flats.slice(0, 10).forEach(f => {
        console.log(`   - Flat ${f.flatNo} (Floor: ${f.floor}, Resident: ${f.resident ? 'Yes' : 'No'})`);
      });
      if (flats.length > 10) {
        console.log(`   ... and ${flats.length - 10} more`);
      }
    }

    // Get residents in this society
    const residents = await Resident.find({ societyId: society._id }).limit(10);
    console.log(`\n👥 Residents in Prestige Towers: ${residents.length}`);
    residents.forEach(r => {
      console.log(`   - ${r.fullName} (Flat: ${r.flatNumber || 'N/A'}, Flat ID: ${r.flatId || 'N/A'})`);
    });

    // Check for Rohit Sharma specifically
    const rohit = await Resident.findOne({ fullName: /rohit/i });
    if (rohit) {
      console.log(`\n✅ Found Rohit Sharma:`);
      console.log(`   Full Name: ${rohit.fullName}`);
      console.log(`   Flat Number: ${rohit.flatNumber}`);
      console.log(`   Flat ID: ${rohit.flatId}`);
      console.log(`   Society ID: ${rohit.societyId}`);
    } else {
      console.log(`\n❌ Rohit Sharma not found in database`);
    }

    await mongoose.connection.close();
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

checkPrestigeTowerData();
