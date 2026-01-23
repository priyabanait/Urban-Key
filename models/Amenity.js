import mongoose from 'mongoose';

const amenitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['Gym', 'Swimming Pool', 'Clubhouse', 'Sports Court', 'Garden', 'Party Hall', 'Other'],
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  society: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    required: false // optional now
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
