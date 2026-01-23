import mongoose from 'mongoose';

const societySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Society name is required'],
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'India' }
  },
  contactInfo: {
    email: {
      type: String,
      lowercase: true,
      trim: true
    },
    phone: String,
    website: String
  },
  registrationNumber: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  establishedDate: {
    type: Date
  },
  totalTowers: {
    type: Number,
    default: 0
  },
  totalFlats: {
    type: Number,
    default: 0
  },
  settings: {
    maintenanceDueDay: {
      type: Number,
      default: 5,
      min: 1,
      max: 28
    },
    visitorApprovalRequired: {
      type: Boolean,
      default: true
    },
    amenityBookingHoursAdvance: {
      type: Number,
      default: 24
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  }
}, {
  timestamps: true
});

export default mongoose.model('Society', societySchema);
