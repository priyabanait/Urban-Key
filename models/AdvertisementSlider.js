import mongoose from 'mongoose';

const advertisementSliderSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subtitle: { type: String },
    link: { type: String }, // optional URL to redirect when clicked
    isActive: { type: Boolean, default: true },
    image: { type: String }, // path to uploaded image
  },
  { timestamps: true }
);

export default mongoose.model('AdvertisementSlider', advertisementSliderSchema);
