import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Tower from './models/Tower.js';
import Flat from './models/Flat.js';
import Amenity from './models/Amenity.js';
import Society from './models/Society.js';

dotenv.config();

const seedTowersAndAmenities = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    // Get or create default society
    let society = await Society.findOne({ name: 'Default Society' });
    if (!society) {
      society = await Society.create({
        name: 'Default Society',
        address: {
          street: '123 Main Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400001',
          country: 'India'
        },
        contactInfo: {
          email: 'admin@urbankey.com',
          phone: '+91 98765 43210'
        },
        status: 'active'
      });
      console.log('✅ Default society created');
    } else {
      console.log('ℹ️  Using existing society:', society.name);
    }

    // Create Towers
    const towers = [
      { name: 'Tower A', totalFloors: 10, flatsPerFloor: 4, society: society._id },
      { name: 'Tower B', totalFloors: 12, flatsPerFloor: 4, society: society._id },
      { name: 'Tower C', totalFloors: 8, flatsPerFloor: 3, society: society._id }
    ];

    for (const towerData of towers) {
      const existingTower = await Tower.findOne({ name: towerData.name, society: society._id });
      if (!existingTower) {
        const tower = await Tower.create({
          ...towerData,
          totalFlats: towerData.totalFloors * towerData.flatsPerFloor
        });
        console.log(`✅ Tower created: ${tower.name} (${tower.totalFlats} flats)`);

        // Create some sample flats for each tower
        const flatsToCreate = [];
        for (let floor = 1; floor <= Math.min(3, towerData.totalFloors); floor++) {
          for (let flatNum = 1; flatNum <= towerData.flatsPerFloor; flatNum++) {
            const flatNo = `${towerData.name.split(' ')[1]}-${floor}${flatNum.toString().padStart(2, '0')}`;
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

    // Create Amenities
    const amenities = [
      {
        name: 'Swimming Pool',
        type: 'Swimming Pool',
        description: 'Olympic size swimming pool with changing rooms',
        society: society._id,
        location: 'Ground Floor, Main Building',
        capacity: 30,
        timings: '06:00 - 22:00',
        bookingRequired: true,
        isActive: true,
        bookingRules: {
          maxBookingDuration: 2,
          advanceBookingDays: 7,
          maxGuestsAllowed: 2
        }
      },
      {
        name: 'Gym',
        type: 'Gym',
        description: 'Fully equipped fitness center with modern equipment',
        society: society._id,
        location: 'First Floor, Tower A',
        capacity: 20,
        timings: '05:00 - 23:00',
        bookingRequired: false,
        isActive: true
      },
      {
        name: 'Clubhouse',
        type: 'Clubhouse',
        description: 'Multi-purpose hall for events and gatherings',
        society: society._id,
        location: 'Ground Floor, Community Center',
        capacity: 100,
        timings: '09:00 - 23:00',
        bookingRequired: true,
        isActive: true,
        bookingRules: {
          maxBookingDuration: 6,
          advanceBookingDays: 30,
          maxGuestsAllowed: 100
        }
      },
      {
        name: 'Sports Court',
        type: 'Sports Court',
        description: 'Badminton and tennis court',
        society: society._id,
        location: 'Rooftop, Tower B',
        capacity: 8,
        timings: '06:00 - 21:00',
        bookingRequired: true,
        isActive: true,
        bookingRules: {
          maxBookingDuration: 2,
          advanceBookingDays: 3,
          maxGuestsAllowed: 4
        }
      },
      {
        name: 'Party Hall',
        type: 'Party Hall',
        description: 'Banquet hall for private parties and celebrations',
        society: society._id,
        location: 'Second Floor, Community Center',
        capacity: 80,
        timings: '10:00 - 23:00',
        bookingRequired: true,
        isActive: true,
        bookingRules: {
          maxBookingDuration: 8,
          advanceBookingDays: 15,
          maxGuestsAllowed: 80
        }
      }
    ];

    for (const amenityData of amenities) {
      const existingAmenity = await Amenity.findOne({ name: amenityData.name, society: society._id });
      if (!existingAmenity) {
        await Amenity.create(amenityData);
        console.log(`✅ Amenity created: ${amenityData.name}`);
      } else {
        console.log(`ℹ️  Amenity already exists: ${amenityData.name}`);
      }
    }

    console.log('\n🎉 Towers and Amenities seeding completed!');
    console.log('\n📋 Summary:');
    console.log('================================');
    const towerCount = await Tower.countDocuments({ society: society._id });
    const flatCount = await Flat.countDocuments({ society: society._id });
    const amenityCount = await Amenity.countDocuments({ society: society._id });
    console.log(`Towers: ${towerCount}`);
    console.log(`Flats: ${flatCount}`);
    console.log(`Amenities: ${amenityCount}`);
    console.log('================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedTowersAndAmenities();
