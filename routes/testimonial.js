import express from 'express';
import multer from 'multer';
import cloudinary from '../config/cloudinary.js';
import Testimonial from '../models/Testimonials.js';
import { authenticate } from '../middleware/authMiddleware.js';

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
router.post('/', authenticate, upload.single('image'), async (req, res) => {
  try {
    const { name, designation, message, rating, isActive, society } = req.body;

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

    const testimonialData = {
      name,
      designation,
      message,
      rating: rating || 5,
      isActive: isActive ?? true,
      image,
      imagePublicId,
      approved: false
    };

    // If the client provided a society or the request has an authenticated user with societyId, attach it
    if (society) testimonialData.society = society;
    if (req.user?.societyId) testimonialData.society = req.user.societyId;

    const testimonial = await Testimonial.create(testimonialData);

    res.status(201).json(testimonial);
  } catch (error) {
    console.error('CREATE TESTIMONIAL ERROR:', error);
    res.status(500).json({ error: 'Failed to create testimonial' });
  }
});

/* ================= GET ALL ================= */
router.get('/', async (req, res) => {
  try {
    // Parse optional mock user header (don't apply authenticate here to avoid default user injection)
    const headerUser = req.headers['x-mock-user'] || req.headers['x-mockuser'];
    let user = null;
    if (headerUser) {
      try {
        user = typeof headerUser === 'string' ? JSON.parse(headerUser) : headerUser;
      } catch (err) {
        user = null;
      }
    }

    const query = {};

    // If requester is a society admin, show only testimonials for their society (including unapproved)
    if (user?.role === 'society_admin' && user.societyId) {
      query.society = user.societyId;
    } else if (!user) {
      // Public requests (no user) should only see approved and active testimonials
      query.approved = true;
      query.isActive = true;
    } else {
      // Authenticated non-society_admin users (e.g., super_admin) see all
    }

    const testimonials = await Testimonial.find(query).sort({ createdAt: -1 }).populate('society', 'name');
    res.json(testimonials);
  } catch (err) {
    console.error('FETCH TESTIMONIALS ERROR:', err);
    res.status(500).json({ error: 'Failed to fetch testimonials' });
  }
});

/* ================= GET ACTIVE ================= */
router.get('/active', async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ isActive: true, approved: true });
    res.json(testimonials);
  } catch (err) {
    console.error('FETCH ACTIVE TESTIMONIALS ERROR:', err);
    res.status(500).json({ error: 'Failed to fetch active testimonials' });
  }
});

/* ================= GET SINGLE ================= */
router.get('/:id', async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id).populate('society', 'name');
    if (!testimonial) {
      return res.status(404).json({ error: 'Testimonial not found' });
    }
    res.json(testimonial);
  } catch (err) {
    console.error('FETCH SINGLE TESTIMONIAL ERROR:', err);
    res.status(500).json({ error: 'Invalid testimonial ID' });
  }
});

/* ================= UPDATE ================= */
router.put('/:id', authenticate, upload.single('image'), async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'testimonials');
      updateData.image = result.secure_url;
      updateData.imagePublicId = result.public_id;
    }
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) return res.status(404).json({ error: 'Testimonial not found' });

    // If society_admin, ensure they update only testimonials belonging to their society
    const role = req.user?.role;
    if (role === 'society_admin' && req.user?.societyId) {
      if (!testimonial.society || testimonial.society.toString() !== req.user.societyId.toString()) {
        return res.status(403).json({ error: 'Cannot update testimonials of another society' });
      }
    }

    Object.assign(testimonial, updateData);
    await testimonial.save();
    res.json(testimonial);
  } catch (error) {
    console.error('UPDATE ERROR:', error);
    res.status(500).json({ error: 'Failed to update testimonial' });
  }
});

/* ================= APPROVE (society_admin or super_admin) ================= */
router.put('/:id/approve', authenticate, async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) return res.status(404).json({ error: 'Testimonial not found' });

    // Only super_admin or society_admin can approve
    const role = req.user?.role;
    if (!role || (role !== 'super_admin' && role !== 'society_admin' && role !== 'admin')) {
      return res.status(403).json({ error: 'Not authorized to approve testimonials' });
    }

    // If society_admin, ensure testimonial belongs to their society
    if (role === 'society_admin' && req.user?.societyId) {
      if (!testimonial.society || testimonial.society.toString() !== req.user.societyId.toString()) {
        return res.status(403).json({ error: 'Cannot approve testimonials from another society' });
      }
    }

    testimonial.approved = true;
    testimonial.isActive = true;
    await testimonial.save();

    res.json(testimonial);
  } catch (error) {
    console.error('APPROVE ERROR:', error);
    res.status(500).json({ error: 'Failed to approve testimonial' });
  }
});

/* ================= DELETE (WITH CLOUDINARY CLEANUP) ================= */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);

    if (!testimonial) {
      return res.status(404).json({ error: 'Testimonial not found' });
    }

    const role = req.user?.role;
    if (!role || (role !== 'super_admin' && role !== 'society_admin' && role !== 'admin')) {
      return res.status(403).json({ error: 'Not authorized to delete testimonials' });
    }

    if (role === 'society_admin' && req.user?.societyId) {
      if (!testimonial.society || testimonial.society.toString() !== req.user.societyId.toString()) {
        return res.status(403).json({ error: 'Cannot delete testimonials from another society' });
      }
    }

    // 🔥 Delete image from Cloudinary
    if (testimonial.imagePublicId) {
      await cloudinary.uploader.destroy(testimonial.imagePublicId);
    }

    await testimonial.deleteOne();

    res.json({ message: 'Testimonial deleted successfully' });
  } catch (error) {
    console.error('DELETE TESTIMONIAL ERROR:', error);
    res.status(500).json({ error: 'Failed to delete testimonial' });
  }
});

export default router;
