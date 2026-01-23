const mongoose = require('mongoose');
const Tower = require('./models/Tower');
const Flat = require('./models/Flat');
const Resident = require('./models/Resident');

mongoose.connect('mongodb+srv://priyabanait151:priya123@cluster0.vikgunr.mongodb.net/society-gate?retryWrites=true&w=majority')
  .then(async () => {
    console.log('MongoDB Connected');

    // Find Tower A
    const tower = await Tower.findOne({ name: 'Tower A' });
    console.log('\n=== Tower A ===');
    console.log('ID:', tower?._id);
    console.log('Name:', tower?.name);

    // Find a flat in Tower A
    const flat = await Flat.findOne({ tower: tower._id }).populate('resident');
    console.log('\n=== Flat ===');
    console.log('Flat No:', flat?.flatNo);
    console.log('Tower:', flat?.tower);
    console.log('Resident ID:', flat?.resident?._id);
    console.log('Resident Name:', flat?.resident?.fullName);

    // Check all flats
    const allFlats = await Flat.find({ tower: tower._id }).populate('resident');
    console.log('\n=== All Flats in Tower A ===');
    allFlats.forEach(f => {
      console.log(`Flat ${f.flatNo}: Resident = ${f.resident?.fullName || 'NONE'}`);
    });

    // Check if we have any residents
    const residents = await Resident.find();
    console.log('\n=== All Residents ===');
    residents.forEach(r => {
      console.log(`${r.fullName} (${r.mobile}) - Flat: ${r.flatNumber}, Tower: ${r.buildingName}`);
    });

    mongoose.connection.close();
  })
  .catch(err => {
    console.error('MongoDB Error:', err);
    process.exit(1);
  });
