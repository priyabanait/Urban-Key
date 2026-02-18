import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    profession: { type: String, required: true },
    name: { type: String, required: true },
    photo: { type: String }, // path to uploaded image
    address: { type: String, required: true },
    mobile: { type: String, required: true },
    society: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: true
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Service', serviceSchema);
