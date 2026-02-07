import mongoose from "mongoose";

const ResidentSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String },
    mobile: { type: String, required: true, unique: true },

    // ✅ Location
    city: { type: String, required: true },
    society: { type: String, required: true }, // society name

    tower: { type: String },
    flatNumber: { type: String, required: true },

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

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Resident ||
  mongoose.model("Resident", ResidentSchema);
