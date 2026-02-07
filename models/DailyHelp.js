import mongoose from 'mongoose';

const dailyHelpSchema = new mongoose.Schema({
  residentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resident',
    required: true
  },
  helperName: {
    type: String,
    required: [true, 'Helper name is required'],
    trim: true
  },
  helperType: {
    type: String,
    enum: ['Maid', 'Cook', 'Gardener', 'Nanny', 'Driver', 'Other'],
    required: [true, 'Helper type is required']
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  workingDays: {
    type: String,
    trim: true
  },
  workingHours: {
    type: String,
    trim: true
  },
  salary: {
    type: Number,
    default: 0
  },
  aadharNumber: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  documents: {
    aadhar: String,
    other: String
  }
}, {
  timestamps: true
});

export default mongoose.models.DailyHelp || mongoose.model('DailyHelp', dailyHelpSchema);
