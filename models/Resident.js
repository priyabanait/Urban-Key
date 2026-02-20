import mongoose from "mongoose";

const ResidentSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String },
    mobile: { type: String, required: true, unique: true },

    // ✅ Location
    city: { type: String, required: true },
    society: {
      type: mongoose.Schema.Types.Mixed, // Can be string (legacy) or ObjectId
      required: true
    },

    tower: { type: String },
    flatNumber: { type: String, required: true },
    flat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Flat',
      default: null
    },

    ownershipType: {
      type: String,
      enum: ["Owner", "Tenant", "Family Member"],
      default: "Owner",
    },

    moveInDate: { type: Date },

    emergencyContact: {
      name: String,
      phone: String,
      relation: String,
    },

    idProof: { type: String },

    // Photo
    photo: { type: String }, // URL or file path
    // Single uploaded document (PDF or image)
    document: { type: String },
    documentPublicId: { type: String },
    documentUploadedAt: { type: Date },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Resident ||
  mongoose.model("Resident", ResidentSchema);
