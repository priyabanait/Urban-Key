import mongoose from "mongoose";

const visitorSchema = new mongoose.Schema(
  {
    society: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Society",
      required: true,
      index: true,
    },

    flat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Flat",
      required: true,
      index: true,
    },

    resident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resident",
      required: false,
    },

    visitorName: {
      type: String,
      required: true,
      trim: true,
    },

    visitorPhone: {
      type: String,
      required: true,
      trim: true,
    },

    visitorType: {
      type: String,
      enum: ["Guest", "Delivery", "Service Provider", "Cab", "Other"],
      required: true,
    },

    vehicleNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },

    numberOfPeople: {
      type: Number,
      default: 1,
      min: 1,
    },

    checkInTime: {
      type: Date,
      default: Date.now,
    },

    checkOutTime: Date,

    photo: {
      type: String, // optional visitor photo
    },

    securityGuard: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    status: {
      type: String,
      enum: ["Waiting", "Approved", "Checked In", "Checked Out", "Rejected"],
      default: "Waiting",
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Visitor || mongoose.model("Visitor", visitorSchema);
