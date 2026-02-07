import mongoose from 'mongoose';

const CitySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true 
  },

  state: { 
    type: String, 
    required: true,
    trim: true 
  },

  country: { 
    type: String, 
    default: 'India',
    trim: true 
  },

  // ✅ SOCIETIES ARRAY
  societies: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],

  isActive: { 
    type: Boolean, 
    default: true 
  },

  coordinates: {
    latitude: Number,
    longitude: Number
  },

  societyCount: {
    type: Number,
    default: 0
  }

}, { timestamps: true });

/* ================= INDEXES ================= */
CitySchema.index({ name: 1, state: 1 });
CitySchema.index({ isActive: 1 });
CitySchema.index({ "societies.name": 1 });

export default mongoose.models.City || mongoose.model('City', CitySchema);
