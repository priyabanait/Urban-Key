import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Tower from './models/Tower.js';

dotenv.config();

const fixTowerIssue = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected\n');

    // Find and delete the empty tower "A" in Prestige Towers
    const City = (await import('./models/City.js')).default;
    const city = await City.findOne({ name: /bangalore/i });
    if (!city) {
      console.log('❌ City bangalore not found');
      process.exit(1);
    }

    const prestige = await (await import('./models/Society.js')).default.findOne({ 
      name: /prestige/i,
      city: city._id
    });

    if (!prestige) {
      console.log('❌ Prestige Towers not found');
      process.exit(1);
    }

    console.log(`Prestige Towers ID: ${prestige._id}`);

    // Find all towers in Prestige Towers
    const towers = await Tower.find({ society: prestige._id });
    console.log(`\nTowers in Prestige Towers:`);
    towers.forEach(t => {
      console.log(`  - ${t.name} (ID: ${t._id})`);
    });

    // Find the problematic tower "A" (should have totalFlats: 40 but 0 actual flats)
    const problematicTower = towers.find(t => t.name === 'A' && t.totalFlats === 40);

    if (problematicTower) {
      console.log(`\n⚠️  Found problematic tower: ${problematicTower.name} (ID: ${problematicTower._id})`);
      console.log(`   Total Flats: ${problematicTower.totalFlats}`);

      // Delete it
      await Tower.deleteOne({ _id: problematicTower._id });
      console.log(`\n✅ Deleted tower: ${problematicTower.name}`);

      // Alternative: rename "A wing" to "A"
      const aWing = await Tower.findOne({ name: 'A wing', society: prestige._id });
      if (aWing) {
        console.log(`\nNote: "A wing" already exists with ${aWing.totalFlats} flats`);
        console.log(`      Clients should use "A wing" instead of "A"`);
      }
    } else {
      console.log(`\n❌ Problematic tower not found`);
    }

    console.log(`\n✅ Fix complete`);
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

fixTowerIssue();
