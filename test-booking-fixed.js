import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Amenity from './models/Amenity.js';

dotenv.config();

const testBooking = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected\n');

    // Get an active amenity
    const amenity = await Amenity.findOne({ isActive: true });
    if (!amenity) {
      console.log('❌ No active amenities found');
      process.exit(1);
    }

    console.log('='.repeat(60));
    console.log('TEST BOOKING');
    console.log('='.repeat(60));

    const bookingPayload = {
      amenityId: amenity._id.toString(),
      bookingDate: '2026-02-15',
      startTime: '10:00',
      endTime: '12:00',
      purpose: 'Party',
      numberOfGuests: 20,
      buildingName: 'A wing',  // Changed from "A"
      flatNo: '101',           // Changed from "4"
      personName: 'Rohit Sharma',
      cityName: 'bangalore',
      societyName: 'Prestige Towers'
    };

    console.log('\nBooking Payload:');
    console.log(JSON.stringify(bookingPayload, null, 2));

    // Make the request
    const response = await fetch('http://localhost:5000/api/amenity-bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bookingPayload)
    });

    const result = await response.json();

    console.log('\nResponse Status:', response.status);
    console.log('Response Body:');
    console.log(JSON.stringify(result, null, 2));

    if (response.status === 201 && result.success) {
      console.log('\n✅ BOOKING SUCCESSFUL!');
      console.log(`   Booking ID: ${result.data._id}`);
      console.log(`   Status: ${result.data.status}`);
    } else {
      console.log('\n❌ BOOKING FAILED');
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

// Wait a moment for server to be ready, then test
setTimeout(testBooking, 1000);
