import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';

// Load env. Try default .env in current working dir, fallback to project root .env
dotenv.config();
// also attempt to load parent .env (useful when server started from backend/ but env is at repo root)
dotenv.config({ path: path.resolve(process.cwd(), '..', '.env') });

// Support Vite-prefixed env names as a fallback (frontend .env often uses VITE_ prefix)
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET || process.env.VITE_CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.warn('Cloudinary not fully configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.');
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

export const uploadToCloudinary = async (base64String, publicId) => {
  try {
    const result = await cloudinary.uploader.upload(base64String, {
      public_id: publicId,
      overwrite: true,
      resource_type: 'auto'
    });
    return result;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

export default cloudinary;
