import mongoose from 'mongoose';

const FamilyMemberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    relation: { type: String, required: true },
    age: { type: Number }
  },
  { _id: false }
);

const VehicleSchema = new mongoose.Schema(
  {
    vehicleType: {
      type: String,
      enum: ['Two Wheeler', 'Four Wheeler'],
    },
    vehicleNumber: { type: String },
    parkingSlotNumber: { type: String }
  },
  { _id: false }
);

const SocietyMemberSchema = new mongoose.Schema(
  {
    /* ---------------- Personal Details ---------------- */
    fullName: { type: String, required: true, trim: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    dateOfBirth: { type: Date },
    mobile: { type: String, required: true, unique: true },
    alternateMobile: { type: String },
    email: { type: String, lowercase: true },
    governmentIdNumber: { type: String },

    /* ---------------- Society / Flat Details ---------------- */
    societyName: { type: String, required: true },
    buildingName: { type: String },
    flatNumber: { type: String, required: true },
    floorNumber: { type: Number },
    flatType: {
      type: String,
      enum: ['1 BHK', '2 BHK', '3 BHK', 'Duplex']
    },
    ownershipType: {
      type: String,
      enum: ['Owner', 'Tenant'],
      required: true
    },
    moveInDate: { type: Date },

    /* ---------------- Family Details ---------------- */
    numberOfFamilyMembers: { type: Number, default: 1 },
    familyMembers: [FamilyMemberSchema],
    emergencyContactName: { type: String },
    emergencyContactNumber: { type: String },

    /* ---------------- Vehicle Details ---------------- */
    vehicles: [VehicleSchema],

    /* ---------------- Documents ---------------- */
    documents: {
      idProof: { type: String },        // file URL / path
      addressProof: { type: String },
      rentAgreement: { type: String },  // required for tenants (validate in API)
      photo: { type: String }
    },

    /* ---------------- Account & Status ---------------- */
    isNewMember: { type: Boolean, default: true }, // 👈 controls registration form
    registrationCompleted: { type: Boolean, default: false },
    approvedByAdmin: { type: Boolean, default: false },

    /* ---------------- Office Use ---------------- */
    remarks: { type: String },
    approvedBy: { type: String },
    approvedAt: { type: Date }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('Resident', SocietyMemberSchema);
