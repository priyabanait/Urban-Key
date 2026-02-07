import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
  residentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resident',
    required: true
  },
  vehicleType: {
    type: String,
    enum: ['Car', 'Bike', 'Scooter', 'Truck', 'Other'],
    required: [true, 'Vehicle type is required']
  },
  vehicleNumber: {
    type: String,
    required: [true, 'Vehicle number is required'],
    trim: true,
    uppercase: true
  },
  registrationNumber: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    trim: true
  },
  manufacturer: {
    type: String,
    trim: true
  },
  parkingSlotNumber: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

export default mongoose.models.Vehicle || mongoose.model('Vehicle', vehicleSchema);
