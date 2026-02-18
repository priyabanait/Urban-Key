import express from 'express';
import Tower from '../models/Tower.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateTower } from '../middleware/validationMiddleware.js';

const router = express.Router();

// Get all towers (public read)
router.get('/', async (req, res) => {
  try {
    const { societyId } = req.query;
    // Filter by societyId: query param (admin) > user.societyId > none
    let societyFilter = {};
    if (societyId) societyFilter = { society: societyId };
    else if (req.user?.societyId) societyFilter = { society: req.user.societyId };
    const towers = await Tower.find({ ...societyFilter, isActive: true })
      .populate('society', 'name code') // Populate society name and code
      .populate('cityId', 'name state') // Populate city name and state
      .sort({ name: 1 });
    
    res.json({
      success: true,
      count: towers.length,
      data: towers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching towers',
      error: error.message
    });
  }
});

// Get single tower (public read)
router.get('/:id', async (req, res) => {
  try {
    const tower = await Tower.findById(req.params.id)
      .populate('society', 'name code')
      .populate('cityId', 'name state');
    
    if (!tower) {
      return res.status(404).json({
        success: false,
        message: 'Tower not found'
      });
    }

    res.json({
      success: true,
      data: tower
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching tower',
      error: error.message
    });
  }
});

// Create tower
import mongoose from "mongoose";

router.post("/", validateTower, async (req, res) => {
  try {
    const { name, totalFloors, flatsPerFloor, societyId, cityId, address } = req.body;

    // ✅ REQUIRED CHECK
    if (!societyId) {
      return res.status(400).json({
        success: false,
        message: "societyId is required"
      });
    }

    // ✅ VALID OBJECTID CHECK
    if (!mongoose.Types.ObjectId.isValid(societyId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid societyId"
      });
    }

    const tower = await Tower.create({
      name,
      totalFloors: Number(totalFloors),
      flatsPerFloor: Number(flatsPerFloor),
      totalFlats: Number(totalFloors) * Number(flatsPerFloor),
      society: societyId,
      cityId: cityId || undefined,
      address: address || undefined
    });

    res.status(201).json({
      success: true,
      message: "Tower created successfully",
      data: tower
    });
  } catch (error) {
    console.error("CREATE TOWER ERROR:", error);

    // ✅ DUPLICATE NAME ERROR HANDLING
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Tower with this name already exists"
      });
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});




// Update tower
router.put('/:id', validateTower, async (req, res) => {
  try {
    const { name, totalFloors, flatsPerFloor, cityId, address } = req.body;

    const updateData = {
      name,
      totalFloors,
      flatsPerFloor,
      totalFlats: totalFloors * flatsPerFloor
    };
    if (cityId !== undefined) updateData.cityId = cityId;
    if (address !== undefined) updateData.address = address;

    const tower = await Tower.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!tower) {
      return res.status(404).json({
        success: false,
        message: 'Tower not found'
      });
    }

    res.json({
      success: true,
      message: 'Tower updated successfully',
      data: tower
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating tower',
      error: error.message
    });
  }
});

// Delete tower (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const tower = await Tower.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!tower) {
      return res.status(404).json({
        success: false,
        message: 'Tower not found'
      });
    }

    res.json({
      success: true,
      message: 'Tower deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting tower',
      error: error.message
    });
  }
});

// Get towers by society name
router.get('/by-society/:societyName', async (req, res) => {
  try {
    const { societyName } = req.params;
    const { cityName } = req.query;

    // Import Society and City models, use city _id relationship for lookup
    const Society = (await import('../models/Society.js')).default;
    const City = (await import('../models/City.js')).default;

    let city;
    if (cityName) {
      city = await City.findOne({ name: new RegExp(`^${cityName}$`, 'i') });
      if (!city) {
        return res.json({ success: false, message: 'City not found', data: [] });
      }
    }

    const query = { name: new RegExp(`^${societyName}$`, 'i') };
    if (city) query.city = city._id;

    const society = await Society.findOne(query);
    if (!society) {
      return res.json({
        success: false,
        message: 'Society not found',
        data: []
      });
    }

    // Find all towers for this society
    const towers = await Tower.find({ 
      society: society._id,
      isActive: true 
    }).sort({ name: 1 });

    res.json({
      success: true,
      count: towers.length,
      data: towers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching towers',
      error: error.message
    });
  }
});

export default router;
