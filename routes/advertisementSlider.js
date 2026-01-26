import express from 'express';
import multer from 'multer';
import fs from 'fs';
import AdvertisementSlider from '../models/AdvertisementSlider.js';

const router = express.Router();

/* ================== ENSURE UPLOAD FOLDER EXISTS ================== */
const uploadDir = 'uploads/advertisementSlider';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

/* ================== MULTER CONFIG ================== */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only images allowed'));
    cb(null, true);
  }
});

/* ================== CREATE ================== */
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { title, subtitle, link, isActive } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const slider = await AdvertisementSlider.create({
      title,
      subtitle,
      link,
      isActive: isActive ?? true,
      image: req.file ? `/uploads/advertisementSlider/${req.file.filename}` : ''
    });

    res.status(201).json(slider);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create slider' });
  }
});

/* ================== GET ALL ================== */
router.get('/', async (req, res) => {
  try {
    const sliders = await AdvertisementSlider.find().sort({ createdAt: -1 });
    res.json(sliders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sliders' });
  }
});

/* ================== GET SINGLE ================== */
router.get('/:id', async (req, res) => {
  try {
    const slider = await AdvertisementSlider.findById(req.params.id);
    if (!slider) return res.status(404).json({ error: 'Slider not found' });
    res.json(slider);
  } catch (err) {
    res.status(500).json({ error: 'Invalid slider ID' });
  }
});

/* ================== UPDATE ================== */
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.file) updateData.image = `/uploads/advertisementSlider/${req.file.filename}`;

    const slider = await AdvertisementSlider.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!slider) return res.status(404).json({ error: 'Slider not found' });
    res.json(slider);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update slider' });
  }
});

/* ================== DELETE ================== */
router.delete('/:id', async (req, res) => {
  try {
    const slider = await AdvertisementSlider.findByIdAndDelete(req.params.id);
    if (!slider) return res.status(404).json({ error: 'Slider not found' });
    res.json({ message: 'Slider deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete slider' });
  }
});

export default router;
