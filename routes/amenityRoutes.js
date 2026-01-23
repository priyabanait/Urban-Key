import express from 'express';
import Amenity from '../models/Amenity.js';
import Society from '../models/Society.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * Get all amenities for a society
 * GET /api/amenities?societyId=xxx
 */
router.get('/', async (req, res) => {
  try {
    const { societyId } = req.query;

    const query = societyId ? { society: societyId } : {};
    
    const amenities = await Amenity.find(query)
      .populate('society', 'name')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: amenities,
      count: amenities.length
    });
  } catch (error) {
    console.error('Error fetching amenities:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching amenities',
      error: error.message
    });
  }
});

/**
 * Get a single amenity by ID
 * GET /api/amenities/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const amenity = await Amenity.findById(req.params.id)
      .populate('society', 'name');

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
    console.error('Error fetching amenity:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching amenity',
      error: error.message
    });
  }
});

/**
 * Create a new amenity
 * POST /api/amenities
 */
router.post('/', async (req, res) => {
  try {
    const {
      name,
      type,
      description,
      societyId,
      location,
      capacity,
      timings,
      amenityImage,
      bookingRequired,
      isActive,
      bookingRules
    } = req.body;

    // Validate required fields
    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: 'Name and type are required'
      });
    }

    // Validate type enum
    const validTypes = ['Gym', 'Swimming Pool', 'Clubhouse', 'Sports Court', 'Garden', 'Party Hall', 'Other'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // Check if amenity already exists in the society (if society provided)
    const existingAmenity = await Amenity.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      ...(societyId ? { society: societyId } : {}) // only filter by society if provided
    });

    if (existingAmenity) {
      return res.status(400).json({
        success: false,
        message: 'Amenity with this name already exists in this society'
      });
    }

    // Create amenity
    const amenity = new Amenity({
      name,
      type,
      description,
      society: societyId || null,
      location,
      capacity,
      timings,
      amenityImage,
      bookingRequired: bookingRequired !== undefined ? bookingRequired : true,
      isActive: isActive !== undefined ? isActive : true,
      bookingRules: bookingRules || {}
    });

    await amenity.save();

    res.status(201).json({
      success: true,
      message: 'Amenity created successfully',
      data: amenity
    });

  } catch (error) {
    console.error('Error creating amenity:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating amenity',
      error: error.message
    });
  }
});


/**
 * Update an amenity
 * PUT /api/amenities/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const {
      name,
      description,
      location,
      bookingRequired,
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

    // Update fields
    if (name !== undefined) amenity.name = name;
    if (description !== undefined) amenity.description = description;
    if (location !== undefined) amenity.location = location;
    if (bookingRequired !== undefined) amenity.bookingRequired = bookingRequired;
    if (isActive !== undefined) amenity.isActive = isActive;
    if (bookingRules !== undefined) amenity.bookingRules = bookingRules;

    await amenity.save();

    res.json({
      success: true,
      message: 'Amenity updated successfully',
      data: amenity
    });
  } catch (error) {
    console.error('Error updating amenity:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating amenity',
      error: error.message
    });
  }
});

/**
 * Delete an amenity
 * DELETE /api/amenities/:id
 */
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
    console.error('Error deleting amenity:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting amenity',
      error: error.message
    });
  }
});

export default router;
