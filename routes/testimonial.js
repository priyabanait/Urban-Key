import express from 'express';
import multer from 'multer';
import cloudinary from '../config/cloudinary.js';
import Testimonial from '../models/Testimonials.js';

const router = express.Router();

/* ================= MULTER MEMORY STORAGE ================= */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  }
});

/* ================= CLOUDINARY HELPER ================= */
const uploadToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};

/* ================= CREATE TESTIMONIAL ================= */
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { name, designation, message, rating, isActive } = req.body;

    if (!name || !message) {
      return res.status(400).json({ error: 'Name and message are required' });
    }

    let image = '';
    let imagePublicId = '';

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'testimonials');
      image = result.secure_url;
      imagePublicId = result.public_id;
    }

    const testimonial = await Testimonial.create({
      name,
      designation,
      message,
      rating: rating || 5,
      isActive: isActive ?? true,
      image,
      imagePublicId
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
  } catch {
    res.status(500).json({ error: 'Failed to fetch testimonials' });
  }
});

/* ================= GET ACTIVE ================= */
router.get('/active', async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ isActive: true });
    res.json(testimonials);
  } catch {
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
  } catch {
    res.status(500).json({ error: 'Invalid testimonial ID' });
  }
});

/* ================= UPDATE ================= */
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'testimonials');
      updateData.image = result.secure_url;
      updateData.imagePublicId = result.public_id;
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

/* ================= DELETE (WITH CLOUDINARY CLEANUP) ================= */
router.delete('/:id', async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);

    if (!testimonial) {
      return res.status(404).json({ error: 'Testimonial not found' });
    }

    // 🔥 Delete image from Cloudinary
    if (testimonial.imagePublicId) {
      await cloudinary.uploader.destroy(testimonial.imagePublicId);
    }

    await testimonial.deleteOne();

    res.json({ message: 'Testimonial deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete testimonial' });
  }
});

export default router;
