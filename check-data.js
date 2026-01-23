import mongoose from 'mongoose';
import Resident from './models/Resident.js';
import Tower from './models/Tower.js';
import Society from './models/Society.js';
import Amenity from './models/Amenity.js';

mongoose.connect('mongodb+srv://priyabanait151:priya123@cluster0.vikgunr.mongodb.net/society-gate?retryWrites=true&w=majority')
  .then(async () => {
    console.log('MongoDB Connected\n');

    const towers = await Tower.find();
    const societies = await Society.find();
    const amenities = await Amenity.find();
    const residents = await Resident.find();

    console.log('=== TOWERS ===');
    towers.forEach(t => console.log(`${t.name} (${t._id})`));

    console.log('\n=== SOCIETIES ===');
    societies.forEach(s => console.log(`${s.name} (${s._id})`));

    console.log('\n=== AMENITIES ===');
    amenities.forEach(a => console.log(`${a.name} (${a._id})`));

    console.log('\n=== RESIDENTS ===');
    residents.forEach(r => console.log(`${r.fullName} - ${r.buildingName} ${r.flatNumber}`));

    mongoose.connection.close();
  });
