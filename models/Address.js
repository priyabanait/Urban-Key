import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  residentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resident',
    required: true
  },
  addressType: {
    type: String,
    enum: ['Current', 'Permanent', 'Office', 'Other'],
    default: 'Current'
  },
  flatNumber: {
    type: String,
    trim: true
  },
  buildingName: {
    type: String,
    trim: true
  },
  tower: {
    type: String,
    trim: true
  },
  street: {
    type: String,
    trim: true
  },
  area: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true
  },
  postalCode: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    trim: true,
    default: 'India'
  },
  phone: {
    type: String,
    trim: true
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export default mongoose.models.Address || mongoose.model('Address', addressSchema);
