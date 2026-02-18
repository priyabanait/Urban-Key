import mongoose from "mongoose";

const CitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      default: "India",
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point']
      }, // GeoJSON type (no default to avoid partial objects)
      coordinates: {
        type: [Number]
      } // [longitude, latitude]
    },
  },
  { timestamps: true }
);

// Indexes
CitySchema.index({ name: 1, state: 1 });
CitySchema.index({ isActive: 1 });
CitySchema.index({ coordinates: "2dsphere" });

export default mongoose.models.City || mongoose.model("City", CitySchema);
