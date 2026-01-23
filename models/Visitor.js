import mongoose from 'mongoose';

const visitorSchema = new mongoose.Schema({
  society: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    required: true
  },
  flat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Flat',
    required: true
  },
  resident: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resident'
  },
  visitorName: {
    type: String,
    required: [true, 'Visitor name is required'],
    trim: true
  },
  visitorPhone: {
    type: String,
    required: [true, 'Visitor phone is required'],
    trim: true
  },
  visitorType: {
    type: String,
    enum: ['Guest', 'Delivery', 'Service Provider', 'Cab', 'Other'],
    required: true
  },
  purpose: {
    type: String,
    trim: true
  },
  vehicleNumber: {
    type: String,
    trim: true,
    uppercase: true
  },
  numberOfPeople: {
    type: Number,
    default: 1,
    min: 1
  },
  checkInTime: {
    type: Date,
    default: Date.now
  },
  checkOutTime: {
    type: Date,
    default: null
  },
  photo: {
    type: String,
    default: null
  },
  isPreApproved: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  securityGuard: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['Waiting', 'Approved', 'Checked In', 'Checked Out', 'Rejected'],
    default: 'Waiting'
  },
  remarks: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Visitor', visitorSchema);
