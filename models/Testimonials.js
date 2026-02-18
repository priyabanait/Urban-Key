import mongoose from 'mongoose';

const testimonialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    designation: {
      type: String,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5
    },
    image: {
      type: String // image URL (Cloudinary or other)
    },
    isActive: {
      type: Boolean,
      default: true
    },
    society: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      default: null
    },
    approved: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export default mongoose.model('Testimonial', testimonialSchema);
