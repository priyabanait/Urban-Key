import mongoose from 'mongoose';

const towerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tower name is required'],
    trim: true,
    unique: true
  },
  totalFloors: {
    type: Number,
    required: [true, 'Total floors is required'],
    min: 1
  },
  flatsPerFloor: {
    type: Number,
    required: [true, 'Flats per floor is required'],
    min: 1
  },
  totalFlats: {
    type: Number,
    required: true
  },
  society: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Tower', towerSchema);
