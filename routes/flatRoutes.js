import express from 'express';
import Flat from '../models/Flat.js';
import Resident from '../models/Resident.js';
import mongoose from 'mongoose';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateFlat } from '../middleware/validationMiddleware.js';

const router = express.Router();

// Get all flats with filters (public read)
router.get('/', async (req, res) => {
  try {
    const { tower, occupancyStatus, ownership, search, society } = req.query;
    
    const query = { isActive: true };
    
    // Filter by society if provided in query
    if (society) {
      // Ensure proper ObjectId comparison
      if (mongoose.Types.ObjectId.isValid(society)) {
        query.society = new mongoose.Types.ObjectId(society);
      } else {
        query.society = society;
      }
      console.log('Filtering flats by society:', society, 'Query:', query.society);
    } else if (req.user?.societyId) {
      // If authenticated, respect society filter
      query.society = req.user.societyId;
    }
    
    if (tower) {
      if (mongoose.Types.ObjectId.isValid(tower)) {
        query.tower = new mongoose.Types.ObjectId(tower);
      } else {
        query.tower = tower;
      }
    }
    if (occupancyStatus) query.occupancyStatus = occupancyStatus;
    if (ownership) query.ownership = ownership;
    if (search) {
      query.flatNo = { $regex: search, $options: 'i' };
    }
    
    console.log('Flats Query:', JSON.stringify(query, null, 2));
    
    const flats = await Flat.find(query)
      .populate('tower', 'name')
      .populate('society', 'name')
      .populate('resident', 'name email phone')
      .sort({ tower: 1, flatNo: 1 });
    
    console.log('Flats found:', flats.length);
    
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
    const { flatNo, tower, society, floor, flatType, carpetArea, ownership, occupancyStatus } = req.body;
    
    console.log('Creating flat with data:', req.body);

    // Check if flat already exists with same number in the same tower
    const existingFlat = await Flat.findOne({ flatNo, tower });
    if (existingFlat) {
      return res.status(400).json({
        success: false,
        message: `Flat number ${flatNo} already exists in this tower`
      });
    }

    const flat = await Flat.create({
      flatNo,
      tower,
      society,
      floor,
      flatType,
      carpetArea: carpetArea || null,
      ownership: ownership || 'Owner',
      occupancyStatus: occupancyStatus || 'Vacant',
      isActive: true
    });

    console.log('Flat created successfully:', flat._id);

    res.status(201).json({
      success: true,
      message: 'Flat created successfully',
      data: flat
    });
  } catch (error) {
    console.error('Error creating flat:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating flat',
      error: error.message,
      details: error.errors ? Object.keys(error.errors).map(key => error.errors[key].message) : []
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
