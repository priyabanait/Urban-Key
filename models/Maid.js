import mongoose from 'mongoose';

const maidSchema = new mongoose.Schema({
  resident: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resident',
    required: true
  },
  flat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Flat',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone is required'],
    trim: true
  },
  serviceType: {
    type: String,
    enum: ['Housemaid', 'Cook', 'Driver', 'Nanny', 'Gardener', 'Other'],
    required: true
  },
  workingHours: {
    from: String,
    to: String
  },
  photo: {
    type: String,
    default: null
  },
  policeVerification: {
    verified: {
      type: Boolean,
      default: false
    },
    documentUrl: String,
    verifiedDate: Date
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Maid', maidSchema);
