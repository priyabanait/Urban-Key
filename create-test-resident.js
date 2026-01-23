import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Resident from './models/Resident.js';
import User from './models/User.js';
import Tower from './models/Tower.js';
import Flat from './models/Flat.js';
import Society from './models/Society.js';

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB Connected');

    try {
      // Check existing residents
      const existingResidents = await Resident.find();
      console.log(`\n📋 Found ${existingResidents.length} existing residents:`);
      existingResidents.forEach(r => {
        console.log(`- ${r.fullName} (${r.mobile}) - ${r.buildingName} ${r.flatNumber}`);
      });

      // Get Tower A and a society
      const tower = await Tower.findOne({ name: 'Tower A' });
      console.log('Tower query result:', tower);
      
      const society = await Society.findOne();
      console.log('Society query result:', society);
      
      if (!tower) {
        console.log('❌ Tower A not found');
        const allTowers = await Tower.find();
        console.log('Available towers:', allTowers.map(t => t.name));
        mongoose.connection.close();
        return;
      }
      
      if (!society) {
        console.log('❌ No society found');
        mongoose.connection.close();
        return;
      }

      const flat = await Flat.findOne({ flatNo: 'A-101', tower: tower._id });
      console.log('Flat query result:', flat);
      
      if (!flat) {
        const allFlats = await Flat.find({ tower: tower._id }).limit(5);
        console.log('Available flats in Tower A:', allFlats.map(f => f.flatNo));
        mongoose.connection.close();
        return;
      }

      if (!tower || !society || !flat) {
        console.log('❌ Missing tower, society, or flat');
        mongoose.connection.close();
        return;
      }

      console.log('\n✅ Found required data:');
      console.log('Tower:', tower.name, tower._id);
      console.log('Society:', society.name, society._id);
      console.log('Flat:', flat.flatNo, flat._id);

      // Create a test resident if none exists
      if (existingResidents.length === 0) {
        // First create or find existing user
        let user = await User.findOne({ mobile: '9876543210' });
        
        if (!user) {
          user = await User.create({
            mobile: '9876543210',
            password: 'password123',
            role: 'resident',
            status: 'active',
            registrationCompleted: true,
            society: society._id
          });
          console.log('✅ Created User:', user.mobile);
        } else {
          console.log('✅ Found existing User:', user.mobile);
        }

        // Create resident
        const resident = await Resident.create({
          user: user._id,
          fullName: 'John Doe',
          email: 'john.doe@example.com',
          mobile: '9876543210',
          societyName: 'Default Society',
          buildingName: 'Tower A',
          flatNumber: 'A-101',
          ownershipType: 'Owner',
          society: society._id,
          isApproved: true
        });

        console.log('✅ Created Resident:', resident.fullName);

        // Link to flat
        flat.resident = resident._id;
        await flat.save();
        console.log('✅ Linked resident to flat');

        // Verify
        const updatedFlat = await Flat.findById(flat._id).populate('resident');
        console.log('\n✅ Verification:');
        console.log('Flat:', updatedFlat.flatNo);
        console.log('Resident:', updatedFlat.resident.fullName);
        console.log('Resident ID:', updatedFlat.resident._id);
      } else {
        console.log('\n✅ Residents already exist, no need to create');
      }

    } catch (error) {
      console.error('❌ Error:', error.message);
      console.error(error);
    }

    mongoose.connection.close();
  })
  .catch(err => {
    console.error('MongoDB Error:', err);
    process.exit(1);
  });
