import express from 'express';
import multer from 'multer';
import Amenity from '../models/Amenity.js';
import AmenityName from '../models/AmenityName.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

const router = express.Router();

/* ================================
   MULTER CONFIG (MEMORY STORAGE)
================================ */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});


/* =====================================
   GET ALL AMENITIES
   GET /api/amenities?cityName=xxx&societyId=yyy
===================================== */
router.get('/', async (req, res) => {
  try {
    const { societyId, cityName } = req.query;

    const query = {};
    if (societyId) query.societyId = societyId;
    if (cityName) query.cityName = cityName;

    const amenities = await Amenity.find(query)
      .populate('name', 'name image')   // 🔥 include image
      .populate('society', 'name address')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: amenities,
      count: amenities.length
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching amenities',
      error: error.message
    });
  }
});


/* =====================================
   GET SINGLE AMENITY
===================================== */
router.get('/:id', async (req, res) => {
  try {
    const amenity = await Amenity.findById(req.params.id)
      .populate('name', 'name image')
      .populate('society', 'name address');

    if (!amenity) {
      return res.status(404).json({
        success: false,
        message: 'Amenity not found'
      });
    }

    res.json({
      success: true,
      data: amenity
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching amenity',
      error: error.message
    });
  }
});


/* =====================================
   SEARCH AMENITY
===================================== */
router.get('/search/filter', async (req, res) => {
  try {
    const { cityName, societyId, keyword } = req.query;

    const query = {};
    if (cityName) query.cityName = cityName;
    if (societyId) query.societyId = societyId;

    if (keyword) {
      const amenityNames = await AmenityName.find({
        name: { $regex: keyword, $options: 'i' }
      });

      const nameIds = amenityNames.map(a => a._id);
      query.name = { $in: nameIds };
    }

    const amenities = await Amenity.find(query)
      .populate('name', 'name image')
      .populate('society', 'name address');

    res.json({
      success: true,
      data: amenities,
      count: amenities.length
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching amenities',
      error: error.message
    });
  }
});


/* =====================================
   CREATE AMENITY (WITH IMAGE UPLOAD)
===================================== */
router.post(
  '/',
  upload.single('amenityImage'),
  async (req, res) => {
    try {
      const {
        name,            // ObjectId of AmenityName
        cityName,
        societyId,
        capacity,
        timings,
        isActive,
        bookingRules
      } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'AmenityName ID is required'
        });
      }

      if (!cityName && !societyId) {
        return res.status(400).json({
          success: false,
          message: 'City name or society ID is required'
        });
      }

      // duplicate check
      const existingAmenity = await Amenity.findOne({
        name,
        ...(cityName ? { cityName } : {}),
        ...(societyId ? { societyId } : {})
      });

      if (existingAmenity) {
        return res.status(400).json({
          success: false,
          message: 'Amenity already exists'
        });
      }

      let imageUrl = '';

      if (req.file) {
        const result = await uploadToCloudinary(
          req.file.buffer,
          'amenities'
        );
        imageUrl = result.secure_url;
      }

      const amenity = await Amenity.create({
        name,
        cityName,
        societyId,
        society: societyId || null,
        capacity,
        timings,
        amenityImage: imageUrl,
        isActive: isActive ?? true,
        bookingRules: bookingRules || {}
      });

      res.status(201).json({
        success: true,
        message: 'Amenity created successfully',
        data: amenity
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating amenity',
        error: error.message
      });
    }
  }
);


/* =====================================
   UPDATE AMENITY (WITH IMAGE UPDATE)
===================================== */
router.put(
  '/:id',
  upload.single('amenityImage'),
  async (req, res) => {
    try {
      const {
        name,
        capacity,
        timings,
        isActive,
        bookingRules
      } = req.body;

      const amenity = await Amenity.findById(req.params.id);

      if (!amenity) {
        return res.status(404).json({
          success: false,
          message: 'Amenity not found'
        });
      }

      if (req.file) {
        const result = await uploadToCloudinary(
          req.file.buffer,
          'amenities'
        );
        amenity.amenityImage = result.secure_url;
      }

      if (name !== undefined) amenity.name = name;
      if (capacity !== undefined) amenity.capacity = capacity;
      if (timings !== undefined) amenity.timings = timings;
      if (isActive !== undefined) amenity.isActive = isActive;
      if (bookingRules !== undefined) amenity.bookingRules = bookingRules;

      await amenity.save();

      res.json({
        success: true,
        message: 'Amenity updated successfully',
        data: amenity
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating amenity',
        error: error.message
      });
    }
  }
);


/* =====================================
   DELETE AMENITY
===================================== */
router.delete('/:id', async (req, res) => {
  try {
    const amenity = await Amenity.findByIdAndDelete(req.params.id);

    if (!amenity) {
      return res.status(404).json({
        success: false,
        message: 'Amenity not found'
      });
    }

    res.json({
      success: true,
      message: 'Amenity deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting amenity',
      error: error.message
    });
  }
});

export default router;