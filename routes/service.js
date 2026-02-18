import express from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import cloudinary from '../config/cloudinary.js';
import Service from '../models/Service.js';

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
  },
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

/* ================= CREATE ================= */
router.post('/', upload.single('photo'), async (req, res) => {
  try {
    const { profession, name, address, mobile, society, isActive } = req.body;

    if (!profession || !name || !address || !mobile || !society) {
      return res.status(400).json({ error: 'All fields including society are required' });
    }

    // Validate society is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(society)) {
      return res.status(400).json({ error: 'Invalid society ID' });
    }

    let photo = '';
    let photoPublicId = '';

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'services');
      photo = result.secure_url;
      photoPublicId = result.public_id;
    }

    const service = await Service.create({
      profession,
      name,
      address,
      mobile,
      society: new mongoose.Types.ObjectId(society),
      isActive: isActive ?? true,
      photo,
      photoPublicId,
    });

    // Populate society after creation
    await service.populate('society', 'name');

    res.status(201).json(service);
  } catch (err) {
    console.error('CREATE SERVICE ERROR:', err);
    res.status(500).json({ error: 'Failed to create service', details: err.message });
  }
});

/* ================= GET ALL ================= */
router.get('/', async (req, res) => {
  try {
    const { society } = req.query;
    const query = {};

    // Filter by society if provided
    if (society) {
      if (mongoose.Types.ObjectId.isValid(society)) {
        query.society = new mongoose.Types.ObjectId(society);
      } else {
        query.society = society;
      }
      console.log('Filtering services by society:', society);
    }

    const services = await Service.find(query)
      .populate('society', 'name')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${services.length} services`, query);
    res.json(services);
  } catch (err) {
    console.error('GET SERVICES ERROR:', err);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

/* ================= GET SINGLE ================= */
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ error: 'Service not found' });
    res.json(service);
  } catch {
    res.status(500).json({ error: 'Invalid service ID' });
  }
});

/* ================= UPDATE ================= */
router.put('/:id', upload.single('photo'), async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'services');
      updateData.photo = result.secure_url;
      updateData.photoPublicId = result.public_id;
    }

    const service = await Service.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!service) return res.status(404).json({ error: 'Service not found' });
    res.json(service);
  } catch (err) {
    console.error('UPDATE SERVICE ERROR:', err);
    res.status(500).json({ error: 'Failed to update service' });
  }
});

/* ================= DELETE (WITH CLOUDINARY CLEANUP) ================= */
router.delete('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // 🔥 Delete image from Cloudinary
    if (service.photoPublicId) {
      await cloudinary.uploader.destroy(service.photoPublicId);
    }

    await service.deleteOne();

    res.json({ message: 'Service deleted successfully' });
  } catch (err) {
    console.error('DELETE SERVICE ERROR:', err);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

export default router;
