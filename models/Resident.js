import mongoose from "mongoose";

const ResidentSchema = new mongoose.Schema(
  {
    fullName: { 
  type: String, 
  required: false 
},

email: { 
  type: String 
},

mobile: { 
  type: String, 
  required: false,
  unique: true,
  sparse: true   // ⚠️ IMPORTANT
},

    // ✅ Location
    city: { type: String, required: true },
    society: {
      type: mongoose.Schema.Types.Mixed, // Can be string (legacy) or ObjectId
      required: false
    },

    tower: { type: String },
    flatNumber: { type: String, required: false },
    flat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Flat',
      default: null
    },

    ownershipType: {
      type: String,
      enum: ["Flat Owner", "Tenant", "Renting with other flatmates"],
      default: "Owner",
    },
 occupancyStatus: {
      type: String,
      enum: ["Currently Residing", "Moving In"],
      default: "Currently Residing"
    },
    moveInDate: { type: Date },

    emergencyContact: {
      name: String,
      phone: String,
      relation: String,
    },

    idProof: { type: String },

    documents: {
  rentalAgreement: {
    url: { type: String },
    publicId: { type: String },
    uploadedAt: { type: Date }
  },
  photoId: {
    url: { type: String },
    publicId: { type: String },
    uploadedAt: { type: Date }
  },
  policeVerification: {
    url: { type: String },
    publicId: { type: String },
    uploadedAt: { type: Date }
  },
  indexCopy: {
    url: { type: String },
    publicId: { type: String },
    uploadedAt: { type: Date }
  }
},

   isActive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Resident ||
  mongoose.model("Resident", ResidentSchema);
