import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Society from './models/Society.js';
import Amenity from './models/Amenity.js';
import Tower from './models/Tower.js';
import Flat from './models/Flat.js';
import Resident from './models/Resident.js';

dotenv.config();

const seedAmenities = async () => {
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
    }

    // Clear existing amenities for this society
    await Amenity.deleteMany({ society: society._id });
    console.log('🗑️  Cleared existing amenities');

    // Create sample amenities
    const amenities = [
      {
        name: 'Swimming Pool',
        type: 'Swimming Pool',
        description: 'Olympic size swimming pool with separate kids pool',
        society: society._id,
        location: 'Block A, Ground Floor',
        capacity: 30,
        bookingRequired: true,
        isActive: true,
        bookingRules: {
          maxDuration: 2,
          advanceBookingDays: 7,
          charges: 100,
          maxGuestsAllowed: 5
        }
      },
      {
        name: 'Club House',
        type: 'Clubhouse',
        description: 'Spacious club house with AC and sound system',
        society: society._id,
        location: 'Main Building',
        capacity: 50,
        bookingRequired: true,
        isActive: true,
        bookingRules: {
          maxDuration: 4,
          advanceBookingDays: 14,
          charges: 500,
          maxGuestsAllowed: 50
        }
      },
      {
        name: 'Gym',
        type: 'Gym',
        description: 'Fully equipped gym with modern facilities',
        society: society._id,
        location: 'Block B, First Floor',
        capacity: 20,
        bookingRequired: false,
        isActive: true,
        bookingRules: {
          maxDuration: 2,
          advanceBookingDays: 1,
          charges: 0,
          maxGuestsAllowed: 1
        }
      },
      {
        name: 'Badminton Court',
        type: 'Sports Court',
        description: 'Indoor badminton court',
        society: society._id,
        location: 'Sports Complex',
        capacity: 4,
        bookingRequired: true,
        isActive: true,
        bookingRules: {
          maxDuration: 2,
          advanceBookingDays: 3,
          charges: 200,
          maxGuestsAllowed: 4
        }
      },
      {
        name: 'Party Hall',
        type: 'Party Hall',
        description: 'Large party hall for celebrations',
        society: society._id,
        location: 'Tower C, Terrace',
        capacity: 100,
        bookingRequired: true,
        isActive: true,
        bookingRules: {
          maxDuration: 6,
          advanceBookingDays: 30,
          charges: 1000,
          maxGuestsAllowed: 100
        }
      }
    ];

    const createdAmenities = await Amenity.insertMany(amenities);
    console.log(`✅ Created ${createdAmenities.length} amenities`);

    // Create sample tower and flat for testing
    let tower = await Tower.findOne({ society: society._id });
    if (!tower) {
      tower = await Tower.create({
        name: 'Tower A',
        society: society._id,
        totalFloors: 10,
        flatsPerFloor: 4,
        isActive: true
      });
      console.log('✅ Created sample tower');
    }

    // Create sample flat
    let flat = await Flat.findOne({ tower: tower._id, flatNo: 'A-101' });
    if (!flat) {
      flat = await Flat.create({
        flatNo: 'A-101',
        tower: tower._id,
        floor: 1,
        flatType: '2BHK',
        carpetArea: 1000,
        ownership: 'Owner',
        occupancyStatus: 'Occupied',
        society: society._id,
        isActive: true
      });
      console.log('✅ Created sample flat');
    }

    // Create sample resident
    let resident = await Resident.findOne({ mobile: '+91 9876543210' });
    if (!resident) {
      resident = await Resident.create({
        fullName: 'Test Resident',
        gender: 'Male',
        mobile: '+91 9876543210',
        email: 'resident@test.com',
        societyName: society.name,
        flatNumber: 'A-101',
        ownershipType: 'Owner',
        isNewMember: false,
        registrationCompleted: true,
        approvedByAdmin: true
      });
      console.log('✅ Created sample resident');

      // Link resident to flat
      flat.resident = resident._id;
      await flat.save();
      console.log('✅ Linked resident to flat');
    }

    console.log('\n🎉 Amenities seeding completed successfully!');
    console.log('\n📋 Test Data IDs:');
    console.log('================================');
    console.log(`Society ID: ${society._id}`);
    console.log(`Tower ID: ${tower._id}`);
    console.log(`Flat ID: ${flat._id}`);
    console.log(`Resident ID: ${resident._id}`);
    console.log('\n📍 Sample Amenities:');
    createdAmenities.forEach(amenity => {
      console.log(`  - ${amenity.name} (ID: ${amenity._id})`);
    });
    console.log('================================\n');

    console.log('💡 Use these IDs in your Postman requests!');
    console.log(`\n📝 Example booking request:`);
    console.log(JSON.stringify({
      amenityId: createdAmenities[0]._id,
      bookingDate: "2026-01-25",
      startTime: "10:00",
      endTime: "12:00",
      bookedByType: "Resident",
      bookedById: resident._id,
      purpose: "Birthday party",
      numberOfGuests: 20
    }, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding amenities:', error);
    process.exit(1);
  }
};

seedAmenities();
