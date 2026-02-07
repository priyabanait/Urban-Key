import mongoose from 'mongoose';

const petSchema = new mongoose.Schema({
  residentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resident',
    required: true
  },
  petName: {
    type: String,
    required: [true, 'Pet name is required'],
    trim: true
  },
  petType: {
    type: String,
    enum: ['Dog', 'Cat', 'Bird', 'Rabbit', 'Other'],
    required: [true, 'Pet type is required']
  },
  breed: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    trim: true
  },
  age: {
    type: String,
    trim: true
  },
  vaccinated: {
    type: Boolean,
    default: false
  },
  vaccineExpiry: {
    type: Date
  },
  registrationNumber: {
    type: String,
    trim: true
  },
  photo: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

export default mongoose.models.Pet || mongoose.model('Pet', petSchema);
