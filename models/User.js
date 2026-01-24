import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    unique: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[0-9]{10}$/.test(v);
      },
      message: 'Please provide a valid 10-digit mobile number'
    }
  },
  username: {
    type: String,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password/OTP is required']
  },
  registrationCompleted: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['user', 'resident'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'pending'
  },
  society: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society'
  },
  flat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Flat'
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

export default mongoose.models.User || mongoose.model('User', userSchema);
