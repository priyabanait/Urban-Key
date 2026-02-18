import mongoose from "mongoose";

const societyIssueSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      enum: ["Maintenance", "Security", "Water", "Electricity", "Parking", "Other"],
      default: "Other",
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    society: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Society",
      required: true,
    },

    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // member may be optional when creating issues from admin panel
      required: false,
    },

    flatNo: {
      type: String,
      required: true,
    },

    buildingName: {
      type: String,
      required: true,
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },

    status: {
      type: String,
      enum: ["Open", "In Progress", "Resolved", "Rejected"],
      default: "Open",
    },

    adminRemark: {
      type: String,
    },

    resolvedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model("SocietyIssue", societyIssueSchema);
