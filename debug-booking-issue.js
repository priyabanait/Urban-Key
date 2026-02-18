import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Society from './models/Society.js';
import Tower from './models/Tower.js';
import Flat from './models/Flat.js';
import Resident from './models/Resident.js';
import Amenity from './models/Amenity.js';

dotenv.config();

const debugBookingIssue = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected\n');

    // ===== CHECK SOCIETIES =====
    console.log('='.repeat(60));
    console.log('SOCIETIES');
    console.log('='.repeat(60));
    const societies = await Society.find().limit(50).populate('city', 'name');
    console.log(`Total societies: ${societies.length}`);
    societies.forEach(s => {
      console.log(`  - ${s.name} (City: ${s.city?.name || 'N/A'})`);
    });

    // ===== CHECK TOWERS =====
    console.log('\n' + '='.repeat(60));
    console.log('TOWERS');
    console.log('='.repeat(60));
    const towers = await Tower.find().populate('society', 'name');
    console.log(`Total towers: ${towers.length}`);
    towers.forEach(t => {
      console.log(`  - ${t.name} (Society: ${t.society?.name}, Total Flats: ${t.totalFlats})`);
    });

    // ===== CHECK FLATS IN EACH TOWER =====
    console.log('\n' + '='.repeat(60));
    console.log('FLATS BY TOWER');
    console.log('='.repeat(60));
    for (const tower of towers) {
      const flats = await Flat.find({ tower: tower._id }).select('flatNo floor');
      console.log(`\n${tower.name}:`);
      console.log(`  Total flats in DB: ${flats.length}`);
      if (flats.length > 0) {
        console.log(`  Sample flats: ${flats.slice(0, 10).map(f => f.flatNo).join(', ')}`);
      } else {
        console.log(`  ⚠️  NO FLATS FOUND!`);
      }
    }

    // ===== CHECK RESIDENTS =====
    console.log('\n' + '='.repeat(60));
    console.log('RESIDENTS');
    console.log('='.repeat(60));
    const residents = await Resident.find().select('fullName mobile flatNumber');
    console.log(`Total residents: ${residents.length}`);
    residents.slice(0, 5).forEach(r => {
      console.log(`  - ${r.fullName} (Mobile: ${r.mobile}, Flat: ${r.flatNumber || 'N/A'})`);
    });

    // ===== CHECK AMENITIES =====
    console.log('\n' + '='.repeat(60));
    console.log('AMENITIES');
    console.log('='.repeat(60));
    const amenities = await Amenity.find({ isActive: true }).select('name type');
    console.log(`Active amenities: ${amenities.length}`);
    amenities.forEach(a => {
      console.log(`  - ${a.name} (Type: ${a.type})`);
    });

    // ===== TEST BOOKING SCENARIO =====
    console.log('\n' + '='.repeat(60));
    console.log('TEST BOOKING SCENARIO (From Postman Request)');
    console.log('='.repeat(60));
    
    const testData = {
      cityName: 'bangalore',
      societyName: 'Prestige Towers',
      buildingName: 'A',
      flatNo: '4',
      personName: 'Rohit Sharma'
    };

    console.log(`Looking for: ${JSON.stringify(testData, null, 2)}`);

    const City = (await import('./models/City.js')).default;
    const city = await City.findOne({ name: new RegExp(`^${testData.cityName}$`, 'i') });
    let society = null;
    if (city) {
      society = await Society.findOne({ name: new RegExp(`^${testData.societyName}$`, 'i'), city: city._id });
    }

    if (!society) {
      console.log(`\n❌ Society not found`);
    } else {
      console.log(`\n✅ Society found: ${society.name} (${city?.name || 'N/A'})`);

      const tower = await Tower.findOne({
        $or: [
          { name: new RegExp(`^${testData.buildingName}$`, 'i') },
          { name: new RegExp(`\\b${testData.buildingName}\\b`, 'i') }
        ],
        society: society._id
      });

      if (!tower) {
        console.log(`❌ Tower not found`);
        const availableTowers = await Tower.find({ society: society._id }).select('name');
        console.log(`   Available towers: ${availableTowers.map(t => t.name).join(', ')}`);
      } else {
        console.log(`✅ Tower found: ${tower.name}`);

        const flats = await Flat.find({ tower: tower._id }).select('flatNo');
        console.log(`   Flats in tower: ${flats.length}`);
        if (flats.length > 0) {
          console.log(`   Sample: ${flats.slice(0, 10).map(f => f.flatNo).join(', ')}`);
        }

        // Try to find the flat
        let flat = await Flat.findOne({ 
          flatNo: testData.flatNo,
          tower: tower._id
        });

        if (!flat) {
          console.log(`❌ Flat ${testData.flatNo} not found in tower ${tower.name}`);
          console.log(`   Trying variations...`);
          
          const towerLetter = tower.name.match(/[A-Z]/)?.[0] || '';
          const variations = [
            testData.flatNo,
            `${towerLetter}-${testData.flatNo}`,
            `${towerLetter}${testData.flatNo}`,
            `${towerLetter} ${testData.flatNo}`
          ];
          console.log(`   Variations: ${variations.join(', ')}`);
          
          flat = await Flat.findOne({
            flatNo: { $in: variations },
            tower: tower._id
          });

          if (!flat) {
            console.log(`   ❌ No flat found with variations`);
          } else {
            console.log(`   ✅ Found with variation: ${flat.flatNo}`);
          }
        } else {
          console.log(`✅ Flat found: ${flat.flatNo}`);
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Schema analysis complete`);
    console.log(`Issues to fix:`);
    console.log(`  1. Verify all towers have flats`);
    console.log(`  2. Check for tower/flat naming inconsistencies`);
    console.log(`  3. Ensure resident-flat-tower linking is correct`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

debugBookingIssue();
