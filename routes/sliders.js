import multer from 'multer';
import { promises as fs } from 'fs';
import express from 'express';
import cloudinary from '../config/cloudinary.js';
import Slider from '../models/Slider.js';

const router = express.Router();
import path from 'path';
import { uploadToCloudinary } from '../config/cloudinary.js';
// Multer setup for file uploads
const upload = multer({ storage: multer.memoryStorage() });
/* ================== UPLOAD FILE TO CLOUDINARY (SECURE) ================== */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const isVideo = req.body.isVideo === 'true' || req.body.isVideo === true;
    // Use buffer directly from memory storage
    const fileData = req.file.buffer;
    const base64String = `data:${req.file.mimetype};base64,${fileData.toString('base64')}`;
    // Generate a unique publicId
    const publicId = `sliders/${Date.now()}_${req.file.originalname.replace(/\s+/g, '_')}`;
    // Upload to Cloudinary
    const result = await uploadToCloudinary(base64String, publicId);

    // Create slider in DB
    const slider = new Slider({
      imageUrl: result.secure_url,
      publicId: result.public_id,
      isVideo: isVideo,
      active: true
    });
    await slider.save();

    res.status(201).json(slider);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/* ================== GET ALL SLIDERS ================== */
router.get('/', async (req, res) => {
  try {
    const sliders = await Slider.find().sort({ createdAt: -1 });
    res.json(sliders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================== GET IMAGE SLIDERS ================== */
router.get('/images', async (req, res) => {
  try {
    const images = await Slider.find({ isVideo: false }).sort({ createdAt: -1 });
    res.json(images);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================== GET VIDEO SLIDERS ================== */
router.get('/videos', async (req, res) => {
  try {
    const videos = await Slider.find({ isVideo: true }).sort({ createdAt: -1 });
    res.json(videos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================== CREATE SLIDER (URL ONLY) ================== */
router.post('/', async (req, res) => {
  try {
    const { imageUrl, publicId, isVideo, active } = req.body;

    if (!imageUrl || !publicId) {
      return res.status(400).json({ error: 'imageUrl and publicId required' });
    }

    const slider = new Slider({
      imageUrl,
      publicId,
      isVideo: Boolean(isVideo),
      active: active !== false
    });

    await slider.save();
    res.status(201).json(slider);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================== TOGGLE ACTIVE ================== */
router.patch('/:id', async (req, res) => {
  try {
    const slider = await Slider.findById(req.params.id);
    if (!slider) return res.status(404).json({ error: 'Slider not found' });

    if (typeof req.body.active === 'boolean') {
      slider.active = req.body.active;
    }

    await slider.save();
    res.json(slider);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================== DELETE SLIDER ================== */
router.delete('/:id', async (req, res) => {
  try {
    const slider = await Slider.findById(req.params.id);
    if (!slider) return res.status(404).json({ error: 'Slider not found' });

    try {
      await cloudinary.uploader.destroy(slider.publicId, {
        resource_type: slider.isVideo ? 'video' : 'image'
      });
    } catch (err) {
      console.error('Cloudinary delete failed:', err.message);
    }

    await slider.deleteOne();
    res.status(200).json({ message: 'Deleted successfully', _id: slider._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


export default router;
