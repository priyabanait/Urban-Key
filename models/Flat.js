import mongoose from 'mongoose';

const flatSchema = new mongoose.Schema({
  flatNo: {
    type: String,
    required: [true, 'Flat number is required'],
    trim: true
  },
  tower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tower',
    required: true
  },
  floor: {
    type: Number,
    required: [true, 'Floor number is required']
  },
  flatType: {
    type: String,
    enum: ['1BHK', '2BHK', '3BHK', '4BHK', '5BHK', 'Penthouse', 'Studio'],
    required: true
  },
  carpetArea: {
    type: Number, // in sq ft
    default: null
  },
  ownership: {
    type: String,
    enum: ['Owner', 'Tenant', 'Company'],
    default: 'Owner'
  },
  occupancyStatus: {
    type: String,
    enum: ['Occupied', 'Vacant', 'Under Renovation'],
    default: 'Vacant'
  },
  resident: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resident',
    default: null
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

// Compound index for unique flat number per tower
flatSchema.index({ flatNo: 1, tower: 1 }, { unique: true });

export default mongoose.model('Flat', flatSchema);
