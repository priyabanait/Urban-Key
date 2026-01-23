import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Amenity from './models/Amenity.js';

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB Connected\n');

    const amenities = await Amenity.find();
    
    console.log('=== Available Amenities ===');
    amenities.forEach(a => {
      console.log(`${a.name}: ${a._id}`);
    });

    console.log('\n=== Sample Booking Request ===');
    console.log(`
POST http://localhost:5000/api/amenity-bookings
Content-Type: application/json

{
  "amenityId": "${amenities[0]?._id}",
  "bookingDate": "2026-01-25",
  "startTime": "10:00",
  "endTime": "12:00",
  "buildingName": "Tower A",
  "flatNo": "A-101",
  "personName": "John Doe",
  "purpose": "Family gathering",
  "numberOfGuests": 10
}
    `);

    mongoose.connection.close();
  });
