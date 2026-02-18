import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Resident from './models/Resident.js';
import Flat from './models/Flat.js';
import Tower from './models/Tower.js';
import Society from './models/Society.js';

dotenv.config();

const checkRohitAndFlat = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected\n');

    // Find Rohit
    const rohit = await Resident.findOne({ fullName: /rohit/i });
    console.log('='.repeat(60));
    console.log('CHECKING ROHIT SHARMA');
    console.log('='.repeat(60));
    
    if (rohit) {
      console.log(`✅ Found: ${rohit.fullName}`);
      console.log(`   Mobile: ${rohit.mobile}`);
      console.log(`   Flat Number: ${rohit.flatNumber}`);
      console.log(`   City: ${rohit.city}`);
      console.log(`   Society: ${rohit.society}`);

      // Try to find the flat by flatNumber
      const flat = await Flat.findOne({ flatNo: rohit.flatNumber }).populate('tower');
      if (flat) {
        console.log(`\n✅ Found linked flat: ${flat.flatNo}`);
        console.log(`   Tower: ${flat.tower?.name}`);
        console.log(`   Floor: ${flat.floor}`);
        console.log(`   Resident ID linked to flat: ${flat.resident}`);
      } else {
        console.log(`\n❌ Flat ${rohit.flatNumber} not found in database`);
      }
    } else {
      console.log('❌ Rohit Sharma not found');
      console.log('\nAll residents in DB:');
      const allResidents = await Resident.find().select('fullName mobile flatNumber');
      allResidents.forEach(r => {
        console.log(`  - ${r.fullName} (${r.mobile}) -> Flat ${r.flatNumber}`);
      });
    }

    // Now check the Prestige Towers setup
    console.log('\n' + '='.repeat(60));
    console.log('PRESTIGE TOWERS SETUP');
    console.log('='.repeat(60));

    const prestige = await Society.findOne({ name: /prestige/i });
    if (prestige) {
      const towers = await Tower.find({ society: prestige._id });
      console.log(`Society: ${prestige.name}`);
      console.log(`Towers: ${towers.map(t => t.name).join(', ')}`);

      // Focus on A wing
      const aWing = await Tower.findOne({ name: 'A wing', society: prestige._id });
      if (aWing) {
        const flats = await Flat.find({ tower: aWing._id })
          .populate('resident', 'fullName mobile')
          .limit(20);
        
        console.log(`\nA wing details:`);
        console.log(`  Total flats: ${aWing.totalFlats}`);
        console.log(`  Sample flats with residents:`);
        flats.forEach(f => {
          console.log(`    - ${f.flatNo}: ${f.resident?.fullName || '(vacant)'}`);
        });
      }
    }

    console.log('\n='.repeat(60));
    console.log('WHAT YOU NEED TO BOOK');
    console.log('='.repeat(60));
    console.log(`If booking for Rohit Sharma from Prestige Towers:`);
    console.log(`  - cityName: "bangalore"`);
    console.log(`  - societyName: "Prestige Towers"`);
    console.log(`  - buildingName: "A wing" (NOT "A")`);
    console.log(`  - flatNo: "${rohit?.flatNumber || 'XX'}"`);
    console.log(`  - personName: "Rohit Sharma"`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkRohitAndFlat();
