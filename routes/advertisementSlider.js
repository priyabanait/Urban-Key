import express from 'express';
import multer from 'multer';
import AdvertisementSlider from '../models/AdvertisementSlider.js';
import cloudinary from '../config/cloudinary.js'; // Make sure you have a Cloudinary config

const router = express.Router();

/* ================== MULTER CONFIG (IN-MEMORY) ================== */
const storage = multer.memoryStorage();
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

    let imageUrl = '';
    if (req.file) {
      const result = await cloudinary.uploader.upload_stream(
        { folder: 'advertisementSlider' },
        (error, result) => {
          if (error) throw error;
          imageUrl = result.secure_url;
        }
      ).end(req.file.buffer);

      // Since cloudinary.uploader.upload_stream uses a callback, we can wrap it in a Promise
      const uploadPromise = new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'advertisementSlider' },
          (error, result) => {
            if (error) return reject(error);
            resolve(result.secure_url);
          }
        );
        stream.end(req.file.buffer);
      });

      imageUrl = await uploadPromise;
    }

    const slider = await AdvertisementSlider.create({
      title,
      subtitle,
      link,
      isActive: isActive ?? true,
      image: imageUrl
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

    if (req.file) {
      const uploadPromise = new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'advertisementSlider' },
          (error, result) => {
            if (error) return reject(error);
            resolve(result.secure_url);
          }
        );
        stream.end(req.file.buffer);
      });

      updateData.image = await uploadPromise;
    }

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
