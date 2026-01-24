import express from 'express';
import multer from 'multer';
import cloudinary from '../config/cloudinary.js';
import Slider from '../models/Slider.js';

const router = express.Router();

// Multer setup (in-memory storage)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 50MB max
});

// ================== GET ALL SLIDERS ==================
router.get('/', async (req, res) => {
  try {
    const sliders = await Slider.find().sort({ createdAt: -1 });
    res.json(sliders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================== GET IMAGE SLIDERS ==================
router.get('/images', async (req, res) => {
  try {
    const images = await Slider.find({ isVideo: false }).sort({ createdAt: -1 });
    res.json(images);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================== GET VIDEO SLIDERS ==================
router.get('/videos', async (req, res) => {
  try {
    const videos = await Slider.find({ isVideo: true }).sort({ createdAt: -1 });
    res.json(videos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================== UPLOAD SLIDER (IMAGE / VIDEO) ==================
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File is required' });
    }

    const isVideo = req.body.isVideo === 'true';
    const active = req.body.active !== 'false';

    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: isVideo ? 'video' : 'image',
        folder: 'sliders'
      },
      async (error, uploaded) => {
        if (error) {
          return res.status(500).json({ error: error.message });
        }

        const slider = new Slider({
          imageUrl: uploaded.secure_url,
          active,
          isVideo
        });

        await slider.save();
        return res.status(201).json(slider);
      }
    );

    stream.end(req.file.buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================== DELETE SLIDER ==================
router.delete('/:id', async (req, res) => {
  try {
    const slider = await Slider.findById(req.params.id);
    if (!slider) return res.status(404).json({ error: 'Slider not found' });

    await slider.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================== TOGGLE ACTIVE ==================
router.patch('/:id', async (req, res) => {
  try {
    const slider = await Slider.findById(req.params.id);
    if (!slider) return res.status(404).json({ error: 'Slider not found' });

    slider.active =
      req.body.active !== undefined ? req.body.active : slider.active;

    await slider.save();
    res.json(slider);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
