import mongoose from 'mongoose';

const maintenanceSchema = new mongoose.Schema({
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
    ref: 'Resident',
    required: true
  },
  billingPeriod: {
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    year: {
      type: Number,
      required: true
    }
  },
  charges: {
    maintenanceCharge: {
      type: Number,
      default: 0
    },
    waterCharge: {
      type: Number,
      default: 0
    },
    parkingCharge: {
      type: Number,
      default: 0
    },
    amenityCharge: {
      type: Number,
      default: 0
    },
    penaltyCharge: {
      type: Number,
      default: 0
    },
    otherCharges: [{
      description: String,
      amount: Number
    }]
  },
  totalAmount: {
    type: Number,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Overdue', 'Partial'],
    default: 'Pending'
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  paymentDate: Date,
  paymentMode: {
    type: String,
    enum: ['Cash', 'Cheque', 'Online Transfer', 'UPI', 'Card'],
  },
  transactionId: {
    type: String,
    trim: true
  },
  receiptNumber: {
    type: String,
    trim: true
  },
  remarks: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Calculate total amount before saving
maintenanceSchema.pre('save', function(next) {
  const charges = this.charges;
  let total = 
    charges.maintenanceCharge +
    charges.waterCharge +
    charges.parkingCharge +
    charges.amenityCharge +
    charges.penaltyCharge;
  
  if (charges.otherCharges && charges.otherCharges.length > 0) {
    total += charges.otherCharges.reduce((sum, charge) => sum + charge.amount, 0);
  }
  
  this.totalAmount = total;
  next();
});

export default mongoose.model('Maintenance', maintenanceSchema);
