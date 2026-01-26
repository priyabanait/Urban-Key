import express from 'express';
import multer from 'multer';
import fs from 'fs';
import Service from '../models/Service.js';

const router = express.Router();

/* ================== UPLOAD FOLDER ================== */
const uploadDir = 'uploads/services';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

/* ================== MULTER CONFIG ================== */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only images allowed'));
    cb(null, true);
  },
});

/* ================== CREATE ================== */
router.post('/', upload.single('photo'), async (req, res) => {
  try {
    const { profession, name, address, mobile, isActive } = req.body;
    if (!profession || !name || !address || !mobile)
      return res.status(400).json({ error: 'All fields are required' });

    const service = await Service.create({
      profession,
      name,
      address,
      mobile,
      isActive: isActive ?? true,
      photo: req.file ? `/uploads/services/${req.file.filename}` : '',
    });

    res.status(201).json(service);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create service' });
  }
});

/* ================== GET ALL ================== */
router.get('/', async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

/* ================== GET SINGLE ================== */
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ error: 'Service not found' });
    res.json(service);
  } catch (err) {
    res.status(500).json({ error: 'Invalid service ID' });
  }
});

/* ================== UPDATE ================== */
router.put('/:id', upload.single('photo'), async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.file) updateData.photo = `/uploads/services/${req.file.filename}`;

    const service = await Service.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!service) return res.status(404).json({ error: 'Service not found' });
    res.json(service);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update service' });
  }
});

/* ================== DELETE ================== */
router.delete('/:id', async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) return res.status(404).json({ error: 'Service not found' });
    res.json({ message: 'Service deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

export default router;
