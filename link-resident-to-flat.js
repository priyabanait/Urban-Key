import mongoose from 'mongoose';
import Tower from './models/Tower.js';
import Flat from './models/Flat.js';
import Resident from './models/Resident.js';


mongoose.connect('mongodb+srv://priyabanait151:priya123@cluster0.vikgunr.mongodb.net/society-gate?retryWrites=true&w=majority')
  .then(async () => {
    console.log('MongoDB Connected');

    try {
      // Find John Doe
      const resident = await Resident.findOne({ fullName: 'John Doe' });
      
      if (!resident) {
        console.log('❌ No resident found with name John Doe');
        mongoose.connection.close();
        return;
      }

      console.log('✅ Found Resident:', {
        id: resident._id,
        name: resident.fullName,
        mobile: resident.mobile,
        building: resident.buildingName,
        flatNo: resident.flatNumber
      });

      // Find Tower A
      const tower = await Tower.findOne({ name: 'Tower A' });
      if (!tower) {
        console.log('❌ Tower A not found');
        mongoose.connection.close();
        return;
      }

      console.log('✅ Found Tower A:', tower._id);

      // Find flat 101 in Tower A
      let flat = await Flat.findOne({ flatNo: '101', tower: tower._id });
      
      if (!flat) {
        console.log('❌ Flat 101 not found in Tower A');
        mongoose.connection.close();
        return;
      }

      console.log('✅ Found Flat 101:', {
        id: flat._id,
        flatNo: flat.flatNo,
        currentResident: flat.resident
      });

      // Link resident to flat if not already linked
      if (!flat.resident || flat.resident.toString() !== resident._id.toString()) {
        flat.resident = resident._id;
        await flat.save();
        console.log('✅ Linked John Doe to Flat 101 in Tower A');
      } else {
        console.log('✅ John Doe already linked to Flat 101');
      }

      // Verify the link
      flat = await Flat.findById(flat._id).populate('resident');
      console.log('\n✅ Final Verification:');
      console.log('Flat:', flat.flatNo);
      console.log('Resident:', flat.resident?.fullName);
      console.log('Resident ID:', flat.resident?._id);

    } catch (error) {
      console.error('❌ Error:', error.message);
    }

    mongoose.connection.close();
  })
  .catch(err => {
    console.error('MongoDB Error:', err);
    process.exit(1);
  });
