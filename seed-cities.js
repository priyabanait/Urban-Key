import mongoose from 'mongoose';
import City from './models/City.js';

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/urbankey';

async function seedCities() {
  try {
    await mongoose.connect(mongoURI);
    console.log('MongoDB Connected\n');

    // Clear existing cities (optional)
    await City.deleteMany({});
    console.log('Cleared existing cities');

    // Create cities with societies
    const citiesData = [
      {
        name: 'bangalore',
        state: 'Karnataka',
        country: 'India',
        societies: [
          { name: 'Prestige Towers', code: 'PT001', isActive: true },
          { name: 'Brigade Gateway', code: 'BG001', isActive: true },
          { name: 'Salarpuria Sattva', code: 'SS001', isActive: true },
          { name: 'Godrej East', code: 'GE001', isActive: true },
          { name: 'Green View Apartments', code: 'GVA001', isActive: true }
        ],
        isActive: true
      },
      {
        name: 'mumbai',
        state: 'Maharashtra',
        country: 'India',
        societies: [
          { name: 'Marine Drive Residences', code: 'MDR001', isActive: true },
          { name: 'Bandra Towers', code: 'BT001', isActive: true },
          { name: 'Worli Waterfront', code: 'WW001', isActive: true },
          { name: 'Navi Mumbai Homes', code: 'NMH001', isActive: true }
        ],
        isActive: true
      },
      {
        name: 'delhi',
        state: 'Delhi',
        country: 'India',
        societies: [
          { name: 'DLF Apartments', code: 'DLF001', isActive: true },
          { name: 'Shriram Residence', code: 'SR001', isActive: true },
          { name: 'South Delhi Towers', code: 'SDT001', isActive: true }
        ],
        isActive: true
      }
    ];

    const createdCities = await City.insertMany(citiesData);
    console.log(`\n✅ Created ${createdCities.length} cities with societies:\n`);
    
    createdCities.forEach(city => {
      console.log(`📍 ${city.name.toUpperCase()} (${city.state})`);
      city.societies.forEach(s => {
        console.log(`   ✓ ${s.name} (${s.code})`);
      });
    });

    await mongoose.connection.close();
    console.log('\n✅ Database seeded successfully!');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

seedCities();
