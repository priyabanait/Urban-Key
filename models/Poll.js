import mongoose from 'mongoose';

const pollSchema = new mongoose.Schema({
  society: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  questions: [{
    question: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['Single Choice', 'Multiple Choice', 'Yes/No'],
      default: 'Single Choice'
    },
    options: [{
      text: String,
      votes: {
        type: Number,
        default: 0
      }
    }]
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  targetAudience: {
    type: String,
    enum: ['All', 'Owners Only', 'Specific Towers'],
    default: 'All'
  },
  towers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tower'
  }],
  allowAnonymous: {
    type: Boolean,
    default: false
  },
  responses: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    flat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Flat'
    },
    answers: [{
      questionIndex: Number,
      selectedOptions: [Number]
    }],
    submittedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['Active', 'Closed', 'Draft'],
    default: 'Active'
  }
}, {
  timestamps: true
});

export default mongoose.model('Poll', pollSchema);
