import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Society from './models/Society.js';
import Tower from './models/Tower.js';
import Flat from './models/Flat.js';

dotenv.config();

const seedPrestigeTowersBuildingsAndFlats = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected\n');

    // Get the city object first
    const City = (await import('./models/City.js')).default;
    const city = await City.findOne({ name: /bangalore/i });
    if (!city) {
      console.log('❌ City bangalore not found. Please run seed-cities.js first');
      process.exit(1);
    }

    // Get Prestige Towers society by city _id
    const society = await Society.findOne({ name: /prestige towers/i, city: city._id });

    if (!society) {
      console.log('❌ Prestige Towers society not found. Please run seed-societies.js first');
      process.exit(1);
    }

    console.log(`📍 Using society: ${society.name} (${city.name})\n`);

    // Create towers for Prestige Towers
    const towers = [
      { name: 'A wing', totalFloors: 15, flatsPerFloor: 4, society: society._id },
      { name: 'B wing', totalFloors: 15, flatsPerFloor: 4, society: society._id },
      { name: 'C wing', totalFloors: 10, flatsPerFloor: 3, society: society._id }
    ];

    for (const towerData of towers) {
      const existingTower = await Tower.findOne({ name: towerData.name, society: society._id });
      if (!existingTower) {
        const tower = await Tower.create({
          ...towerData,
          totalFlats: towerData.totalFloors * towerData.flatsPerFloor
        });
        console.log(`✅ Tower created: ${tower.name} (${tower.totalFlats} flats)`);

        // Create sample flats for each tower
        const flatsToCreate = [];
        for (let floor = 1; floor <= Math.min(5, towerData.totalFloors); floor++) {
          for (let flatNum = 1; flatNum <= towerData.flatsPerFloor; flatNum++) {
            const flatNo = `${floor}${flatNum.toString().padStart(2, '0')}`;
            flatsToCreate.push({
              flatNo,
              tower: tower._id,
              society: society._id,
              floor: floor,
              flatType: flatNum <= 2 ? '2BHK' : '3BHK',
              carpetArea: flatNum <= 2 ? 900 : 1200,
              ownership: 'Owner',
              occupancyStatus: 'Vacant',
              isActive: true
            });
          }
        }

        if (flatsToCreate.length > 0) {
          await Flat.insertMany(flatsToCreate);
          console.log(`   ✅ Created ${flatsToCreate.length} sample flats in ${tower.name}`);
        }
      } else {
        console.log(`ℹ️  Tower already exists: ${towerData.name}`);
      }
    }

    console.log('\n✅ Prestige Towers buildings and flats seeded successfully!');
    await mongoose.connection.close();
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

seedPrestigeTowersBuildingsAndFlats();
