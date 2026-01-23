import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const familyMemberSchema = new mongoose.Schema({
  resident: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resident',
    required: true
  },
  flat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Flat',
    required: false  // Made optional since we can derive from resident
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  relation: {
    type: String,
    enum: ['Spouse', 'Child', 'Parent', 'Sibling', 'Other'],
    required: true
  },
  age: {
    type: Number,
    min: 0
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    sparse: true,  // Allow multiple null values but unique non-null values
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow empty email
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please provide a valid email address'
    }
  },
  phone: {
    type: String,
    trim: true
  },
  password: {
    type: String,
    select: false  // Don't return password by default
  },
  photo: {
    type: String,
    default: null
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  canLogin: {
    type: Boolean,
    default: false  // Only family members with email/password can login
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Hash password before saving
familyMemberSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
familyMemberSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('FamilyMember', familyMemberSchema);
