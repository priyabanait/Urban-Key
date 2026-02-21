import mongoose from 'mongoose';

const amenitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
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
 
  capacity: Number,
  timings: String,
  amenityImage: {
  url: { type: String },
  publicId: { type: String },
  uploadedAt: { type: Date, default: Date.now }
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
