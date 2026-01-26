import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import Testimonial from '../models/Testimonials.js';

const router = express.Router();

/* ================= ENSURE UPLOAD DIR EXISTS ================= */
const uploadDir = 'uploads/testimonials';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/* ================= MULTER CONFIG ================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  }
});

/* ================= CREATE TESTIMONIAL ================= */
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { name, designation, message, rating, isActive } = req.body;

    if (!name || !message) {
      return res.status(400).json({
        error: 'Name and message are required'
      });
    }

    const testimonial = await Testimonial.create({
      name,
      designation,
      message,
      rating: rating || 5,
      isActive: isActive ?? true,
      image: req.file ? `/uploads/testimonials/${req.file.filename}` : ''
    });

    res.status(201).json(testimonial);
  } catch (error) {
    console.error('CREATE TESTIMONIAL ERROR:', error);
    res.status(500).json({ error: 'Failed to create testimonial' });
  }
});

/* ================= GET ALL ================= */
router.get('/', async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 });
    res.json(testimonials);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch testimonials' });
  }
});

/* ================= GET ACTIVE ================= */
router.get('/active', async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ isActive: true });
    res.json(testimonials);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch active testimonials' });
  }
});

/* ================= GET SINGLE ================= */
router.get('/:id', async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) {
      return res.status(404).json({ error: 'Testimonial not found' });
    }
    res.json(testimonial);
  } catch (error) {
    res.status(500).json({ error: 'Invalid testimonial ID' });
  }
});

/* ================= UPDATE ================= */
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.file) {
      updateData.image = `/uploads/testimonials/${req.file.filename}`;
    }

    const testimonial = await Testimonial.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!testimonial) {
      return res.status(404).json({ error: 'Testimonial not found' });
    }

    res.json(testimonial);
  } catch (error) {
    console.error('UPDATE ERROR:', error);
    res.status(500).json({ error: 'Failed to update testimonial' });
  }
});

/* ================= DELETE ================= */
router.delete('/:id', async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id);

    if (!testimonial) {
      return res.status(404).json({ error: 'Testimonial not found' });
    }

    res.json({ message: 'Testimonial deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete testimonial' });
  }
});

export default router;
