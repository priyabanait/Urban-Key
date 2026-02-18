import mongoose from "mongoose";

const SocietySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      trim: true,
    },
    city: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "City",
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point']
      },
      coordinates: {
        type: [Number]
      }
    },
  },
  { timestamps: true }
);

// Indexes
SocietySchema.index({ name: 1 });
SocietySchema.index({ isActive: 1 });
SocietySchema.index({ coordinates: "2dsphere" });

export default mongoose.models.Society || mongoose.model("Society", SocietySchema);
