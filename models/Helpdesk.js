import mongoose from 'mongoose';

const helpdeskSchema = new mongoose.Schema({
  society: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    required: true
  },
  ticketNumber: {
    type: String,
    required: true,
    unique: true
  },
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
  category: {
    type: String,
    enum: ['Plumbing', 'Electrical', 'Carpentry', 'Painting', 'Cleaning', 'Security', 'Other'],
    required: true
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved', 'Closed', 'Rejected'],
    default: 'Open'
  },
  attachments: [{
    type: String
  }],
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  resolvedAt: Date,
  closedAt: Date
}, {
  timestamps: true
});

// Auto-generate ticket number before saving
helpdeskSchema.pre('save', async function(next) {
  if (!this.ticketNumber) {
    const count = await mongoose.model('Helpdesk').countDocuments();
    this.ticketNumber = `TKT${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

export default mongoose.model('Helpdesk', helpdeskSchema);
