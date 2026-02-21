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

const isConfigured = Boolean(cloudName && apiKey && apiSecret);

if (!isConfigured) {
  console.warn('Cloudinary not fully configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.');
}

if (isConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
}

export const uploadToCloudinary = async (base64String, publicId) => {
  if (!isConfigured) {
    console.warn('uploadToCloudinary called but Cloudinary is not configured — returning empty result');
    return { secure_url: '', public_id: null };
  }

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

// If Cloudinary not configured, provide a safe mock for uploader methods used across routes
if (!isConfigured) {
  const mockUploader = {
    upload: async () => ({ secure_url: '', public_id: null }),
    destroy: async () => ({}),
    upload_stream: (options, cb) => {
      // Return an object with end that calls the callback with a mock result
      return {
        end: (/* buffer */) => {
          if (typeof cb === 'function') cb(null, { secure_url: '', public_id: null });
        }
      };
    }
  };

  // Attach mock uploader so imports using cloudinary.uploader.* won't crash
  cloudinary.uploader = mockUploader;
}

export default cloudinary;
