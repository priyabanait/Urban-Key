import mongoose from "mongoose";

const maintenanceSchema = new mongoose.Schema(
  {
    society: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Society",
      required: true
    },

    // ✅ ADDED (tower reference)
    tower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tower",
      required: true
    },

    flat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Flat",
      required: true
    },

    resident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resident",
      required: false,
      default: null
    },

    billingPeriod: {
      month: {
        type: Number,
        required: true,
        min: 1,
        max: 12
      },
      year: {
        type: Number,
        required: true
      }
    },

    charges: {
      maintenanceCharge: {
        type: Number,
        default: 0
      },
      waterCharge: {
        type: Number,
        default: 0
      },
      parkingCharge: {
        type: Number,
        default: 0
      },
      amenityCharge: {
        type: Number,
        default: 0
      },
      penaltyCharge: {
        type: Number,
        default: 0
      },
      otherCharges: [
        {
          description: String,
          amount: Number
        }
      ]
    },

    totalAmount: {
      type: Number,
      required: true
    },

    dueDate: {
      type: Date,
      required: true
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Overdue", "Partial"],
      default: "Pending"
    },

    paidAmount: {
      type: Number,
      default: 0
    },

    paymentDate: Date,

    paymentMode: {
      type: String,
      enum: ["Cash", "Cheque", "Online Transfer", "UPI", "Card"]
    },

    transactionId: {
      type: String,
      trim: true
    },

    receiptNumber: {
      type: String,
      trim: true
    },

    remarks: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);


// ======================================================
// AUTO CALCULATE TOTAL BEFORE SAVE
// ======================================================
maintenanceSchema.pre("save", function (next) {
  const c = this.charges;

  let total =
    (c.maintenanceCharge || 0) +
    (c.waterCharge || 0) +
    (c.parkingCharge || 0) +
    (c.amenityCharge || 0) +
    (c.penaltyCharge || 0);

  if (c.otherCharges && c.otherCharges.length > 0) {
    total += c.otherCharges.reduce((sum, item) => sum + (item.amount || 0), 0);
  }

  this.totalAmount = total;
  next();
});


// ======================================================
// PREVENT DUPLICATE BILL FOR SAME MONTH (IMPORTANT)
// ======================================================
maintenanceSchema.index(
  {
    flat: 1,
    "billingPeriod.month": 1,
    "billingPeriod.year": 1
  },
  { unique: true }
);


export default mongoose.model("Maintenance", maintenanceSchema);
