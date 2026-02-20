import mongoose from "mongoose";

const maintenanceSchema = new mongoose.Schema(
  {
    society: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Society",
      required: true
    },

    flatType: {
      type: String,
      required: true,
      enum: ["1BHK", "2BHK", "3BHK", "4BHK", "Studio", "Other"]
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    billingCycle: {
      type: String,
      enum: ["Monthly", "Quarterly", "Yearly"],
      default: "Monthly"
    },

    description: {
      type: String,
      trim: true
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

/* Prevent duplicate flatType per society */
maintenanceSchema.index({ society: 1, flatType: 1 }, { unique: true });

export default mongoose.model("AddMaintenanceCost", maintenanceSchema);
