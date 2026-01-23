import express from 'express';
import Flat from '../models/Flat.js';
import Resident from '../models/Resident.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateFlat } from '../middleware/validationMiddleware.js';

const router = express.Router();

// Get all flats with filters (public read)
router.get('/', async (req, res) => {
  try {
    const { tower, occupancyStatus, ownership, search } = req.query;
    
    const query = { isActive: true };
    // If authenticated, respect society filter
    if (req.user?.societyId) query.society = req.user.societyId;
    
    if (tower) query.tower = tower;
    if (occupancyStatus) query.occupancyStatus = occupancyStatus;
    if (ownership) query.ownership = ownership;
    if (search) {
      query.flatNo = { $regex: search, $options: 'i' };
    }
    
    const flats = await Flat.find(query)
      .populate('tower', 'name')
      .populate('resident', 'name email phone')
      .sort({ tower: 1, flatNo: 1 });
    
    res.json({
      success: true,
      count: flats.length,
      data: flats
    });
  } catch (error) {
    console.error('Error fetching flats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching flats',
      error: error.message
    });
  }
});

// Get statistics (must come before /:id route)
router.get('/stats/summary', authenticate, async (req, res) => {
  try {
    const totalFlats = await Flat.countDocuments({ society: req.user.societyId, isActive: true });
    const occupied = await Flat.countDocuments({ society: req.user.societyId, isActive: true, occupancyStatus: 'Occupied' });
    const vacant = await Flat.countDocuments({ society: req.user.societyId, isActive: true, occupancyStatus: 'Vacant' });

    res.json({
      success: true,
      data: {
        total: totalFlats,
        occupied,
        vacant,
        occupancyRate: totalFlats > 0 ? ((occupied / totalFlats) * 100).toFixed(2) : 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

// Get single flat (public read)
router.get('/:id', async (req, res) => {
  try {
    const flat = await Flat.findById(req.params.id)
      .populate('tower', 'name')
      .populate('resident', 'name email phone');
    
    if (!flat) {
      return res.status(404).json({
        success: false,
        message: 'Flat not found'
      });
    }

    res.json({
      success: true,
      data: flat
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching flat',
      error: error.message
    });
  }
});

// Create flat
router.post('/', validateFlat, async (req, res) => {
  try {
    const flat = await Flat.create({
      ...req.body
    });

    res.status(201).json({
      success: true,
      message: 'Flat created successfully',
      data: flat
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating flat',
      error: error.message
    });
  }
});

// Update flat
router.put('/:id', async (req, res) => {
  try {
    const flat = await Flat.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!flat) {
      return res.status(404).json({
        success: false,
        message: 'Flat not found'
      });
    }

    res.json({
      success: true,
      message: 'Flat updated successfully',
      data: flat
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating flat',
      error: error.message
    });
  }
});

// Delete flat (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const flat = await Flat.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!flat) {
      return res.status(404).json({
        success: false,
        message: 'Flat not found'
      });
    }

    res.json({
      success: true,
      message: 'Flat deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting flat',
      error: error.message
    });
  }
});

export default router;
