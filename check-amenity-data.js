import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Society from './models/Society.js';
import Tower from './models/Tower.js';
import Flat from './models/Flat.js';

dotenv.config();

const checkData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected\n');

    // Check societies
    const societyCount = await Society.countDocuments();
    console.log(`📍 Societies in database: ${societyCount}`);
    
    const societies = await Society.find().limit(10).populate('city', 'name');
    societies.forEach(s => {
      console.log(`   - ${s.name} (${s.city?.name || 'N/A'})`);
    });

    // Check specific society
    const City = (await import('./models/City.js')).default;
    const city = await City.findOne({ name: /bangalore/i });
    let prestigeTowers = null;
    if (city) {
      prestigeTowers = await Society.findOne({ name: /prestige towers/i, city: city._id }).populate('city', 'name');
    }

    if (prestigeTowers) {
      console.log(`\n✅ Found Prestige Towers in Bangalore`);
      console.log(`   ID: ${prestigeTowers._id}`);
      console.log(`   Name: ${prestigeTowers.name}`);
      console.log(`   City: ${prestigeTowers.city?.name}`);
    } else {
      console.log(`\n❌ Prestige Towers not found in Bangalore`);
    }

    // Check towers
    const towerCount = await Tower.countDocuments();
    console.log(`\n🏢 Towers in database: ${towerCount}`);
    
    const towers = await Tower.find().limit(5).populate('society', 'name');
    towers.forEach(t => {
      console.log(`   - ${t.name} (Society: ${t.society?.name})`);
    });

    // Check flats
    const flatCount = await Flat.countDocuments();
    console.log(`\n🏠 Flats in database: ${flatCount}`);

    await mongoose.connection.close();
    console.log('\n✅ Data check completed');
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

checkData();
