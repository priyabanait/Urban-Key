import mongoose from 'mongoose';
import City from './models/City.js';

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/urbankey';

async function checkCities() {
  try {
    await mongoose.connect(mongoURI);
    console.log('MongoDB Connected\n');

    const cities = await City.find();
    console.log('=== CITIES ===');
    cities.forEach(city => {
      console.log(`${city.name} (${city._id})`);
      console.log(`  State: ${city.state}`);
      console.log(`  Societies: ${city.societies?.length || 0}`);
      if (city.societies && city.societies.length > 0) {
        city.societies.forEach(s => {
          console.log(`    - ${s.name} (${s.code})`);
        });
      }
    });

    await mongoose.connection.close();
  } catch (err) {
    console.error('Error:', err);
  }
}

checkCities();
