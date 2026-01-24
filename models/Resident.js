import mongoose from 'mongoose';

const ResidentSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      lowercase: true,
      trim: true
    },

    mobile: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    buildingName: {
      type: String,
      required: true,
      trim: true
    },

    flatNumber: {
      type: String,
      required: true,
      trim: true
    },

    ownershipType: {
      type: String,
      enum: ['Owner', 'Tenant'],
      required: true
    },

    // ✅ ID Proof (Aadhaar / PAN / Passport etc.)
    idProof: {
      type: String, // file URL or storage path
      required: false
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('Resident', ResidentSchema);
