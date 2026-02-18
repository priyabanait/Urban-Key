import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Society from './models/Society.js';
import Tower from './models/Tower.js';
import Flat from './models/Flat.js';
import Resident from './models/Resident.js';

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const societies = await Society.find({}).lean();
    if (!societies.length) {
      console.log('No societies found');
      process.exit(0);
    }

    for (const soc of societies) {
      console.log(`\nProcessing society: ${soc.name} (${soc._id})`);

      const existingFlatsCount = await Flat.countDocuments({ society: soc._id });
      if (existingFlatsCount > 0) {
        console.log(`  Flats already exist (${existingFlatsCount}), skipping`);
        continue;
      }

      // Create or reuse a tower named 'A' for this society
      let tower = await Tower.findOne({ name: 'A' });
      if (!tower) {
        tower = await Tower.create({ name: 'A', totalFloors: 3, flatsPerFloor: 3, totalFlats: 9, society: soc._id, cityId: soc.city || undefined });
        console.log('  Created tower A with id', tower._id);
      } else {
        console.log('  Reusing existing tower A with id', tower._id, ' (may belong to another society)');
      }

      // Create flats 101,102,103
      const flatsToCreate = [
        { flatNo: '101', tower: tower._id, society: soc._id, floor: 1, flatType: '2BHK', carpetArea: 900, ownership: 'Owner', occupancyStatus: 'Occupied', isActive: true },
        { flatNo: '102', tower: tower._id, society: soc._id, floor: 1, flatType: '2BHK', carpetArea: 900, ownership: 'Owner', occupancyStatus: 'Occupied', isActive: true },
        { flatNo: '103', tower: tower._id, society: soc._id, floor: 1, flatType: '3BHK', carpetArea: 1200, ownership: 'Owner', occupancyStatus: 'Vacant', isActive: true }
      ];

      // Insert flats if they don't exist for this tower
      let createdCount = 0;
      for (const f of flatsToCreate) {
        const exists = await Flat.findOne({ flatNo: f.flatNo, tower: tower._id });
        if (!exists) {
          await Flat.create(f);
          createdCount++;
        }
      }
      console.log(`  Created ${createdCount} new flats (skipped existing)`);

      // Create residents for first two flats if not present
      const residentDefs = [
        { flatNumber: '101', nameSuffix: 'Resident 1' },
        { flatNumber: '102', nameSuffix: 'Resident 2' }
      ];

      let createdResCount = 0;
      for (const rd of residentDefs) {
        const existsR = await Resident.findOne({ flatNumber: rd.flatNumber, society: soc.name });
        if (!existsR) {
          const rdoc = {
            fullName: `${soc.name} ${rd.nameSuffix}`,
            email: '',
            mobile: `900${Math.floor(1000000 + Math.random() * 9000000)}`,
            city: (soc.city && soc.city.name) ? soc.city.name : 'Unknown',
            society: soc.name,
            tower: tower.name,
            flatNumber: rd.flatNumber,
            ownershipType: 'Owner',
            moveInDate: new Date(),
            isActive: true
          };
          await Resident.create(rdoc);
          createdResCount++;
        }
      }
      console.log(`  Created ${createdResCount} new residents (skipped existing)`);
    }

    console.log('\nSeeding complete');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
