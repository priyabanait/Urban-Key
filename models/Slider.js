import mongoose from 'mongoose';

const sliderSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  active: { type: Boolean, default: true },
  isVideo: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('Slider', sliderSchema);