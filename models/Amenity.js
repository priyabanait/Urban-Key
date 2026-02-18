import mongoose from 'mongoose';

const amenitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  cityName: {
    type: String,
    trim: true
  },
  society: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    required: false
  },
  societyId: {
    type: String,
    trim: true
  },
  location: String,
  capacity: Number,
  timings: String,
  amenityImage: String,
  bookingRequired: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  bookingRules: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true
});

export default mongoose.model('Amenity', amenitySchema);
