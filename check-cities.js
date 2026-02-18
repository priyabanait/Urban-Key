import mongoose from 'mongoose';
import City from './models/City.js';
import Society from './models/Society.js';

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/urbankey';

async function checkCities() {
  try {
    await mongoose.connect(mongoURI);
    console.log('MongoDB Connected\n');

    const cities = await City.find();
    console.log('=== CITIES ===');
    for (const city of cities) {
      console.log(`${city.name} (${city._id})`);
      console.log(`  State: ${city.state}`);
      const count = await Society.countDocuments({ city: city._id });
      console.log(`  Societies: ${count}`);
      if (count > 0) {
        const list = await Society.find({ city: city._id }).limit(10).select('name code');
        list.forEach(s => {
          console.log(`    - ${s.name} (${s.code || 'N/A'})`);
        });
      }
    }

    await mongoose.connection.close();
  } catch (err) {
    console.error('Error:', err);
  }
}

checkCities();
