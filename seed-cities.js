import mongoose from 'mongoose';
import City from './models/City.js';
import Society from './models/Society.js';

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/urbankey';

async function seedCities() {
  try {
    await mongoose.connect(mongoURI);
    console.log('MongoDB Connected\n');

    // Clear existing cities (optional)
    await City.deleteMany({});
    console.log('Cleared existing cities');

    // Create cities (societies will be created separately as documents)
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

    // Insert cities without nested societies fields (City schema doesn't contain societies)
    const citiesToInsert = citiesData.map(c => ({
      name: c.name,
      state: c.state,
      country: c.country,
      isActive: c.isActive
    }));

    const createdCities = await City.insertMany(citiesToInsert);
    console.log(`\n✅ Created ${createdCities.length} cities`);

    // Create societies as separate documents referencing the created city _id
    for (let i = 0; i < citiesData.length; i++) {
      const cityInfo = citiesData[i];
      const createdCity = createdCities[i];
      if (!cityInfo.societies || cityInfo.societies.length === 0) continue;

      const societiesToCreate = cityInfo.societies.map(s => ({
        name: s.name,
        code: s.code,
        city: createdCity._id,
        isActive: s.isActive
      }));

      try {
        const created = await Society.insertMany(societiesToCreate, { ordered: false });
        console.log(`   📍 ${createdCity.name.toUpperCase()} - added ${created.length} societies`);
      } catch (err) {
        // ignore duplicate errors or continue
      }
    }

    await mongoose.connection.close();
    console.log('\n✅ Database seeded successfully!');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

seedCities();
