import mongoose from 'mongoose';

const amenityBookingSchema = new mongoose.Schema({
  amenity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Amenity',
    required: true
  },
  society: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    required: false
  },
  flat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Flat',
    required: false // Optional for secretary bookings
  },
  // Either resident or family member can book
  bookedBy: {
    userType: {
      type: String,
      enum: ['Resident', 'FamilyMember', 'Secretary'],
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false, // Optional for secretary bookings
      refPath: 'bookedBy.userType'
    },
    name: {
      type: String,
      required: true
    }
  },
  bookingType: {
    type: String,
    enum: ['ResidentBooking', 'SecretaryBooking'],
    default: 'ResidentBooking'
  },
  secretaryDetails: {
    secretaryName: String,
    meetingType: String,
    participantCount: Number
  },
  bookingDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true // Format: "HH:MM"
  },
  endTime: {
    type: String,
    required: true // Format: "HH:MM"
  },
  duration: {
    type: Number, // in hours
    required: true
  },
  purpose: {
    type: String,
    trim: true
  },
  numberOfGuests: {
    type: Number,
    default: 0
  },
  charges: {
    type: Number,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
    default: 'Pending'
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Cancelled', 'Completed'],
    default: 'Pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  rejectionReason: String,
  cancellationReason: String,
  cancelledAt: Date,
  notes: String
}, {
  timestamps: true
});

// Index for checking conflicts
amenityBookingSchema.index({ amenity: 1, bookingDate: 1, status: 1 });

// Method to check for booking conflicts
amenityBookingSchema.statics.checkConflict = async function(amenityId, bookingDate, startTime, endTime, excludeBookingId = null) {
  const query = {
    amenity: amenityId,
    bookingDate: new Date(bookingDate),
    status: { $in: ['Pending', 'Approved'] },
    $or: [
      // New booking starts during existing booking
      { startTime: { $lte: startTime }, endTime: { $gt: startTime } },
      // New booking ends during existing booking
      { startTime: { $lt: endTime }, endTime: { $gte: endTime } },
      // New booking completely overlaps existing booking
      { startTime: { $gte: startTime }, endTime: { $lte: endTime } }
    ]
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const conflicts = await this.find(query);
  return conflicts.length > 0;
};

export default mongoose.model('AmenityBooking', amenityBookingSchema);
