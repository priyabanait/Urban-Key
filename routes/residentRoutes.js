import express from 'express';
import Resident from '../models/Resident.js';
import User from '../models/User.js';

const router = express.Router();

/**
 * ✅ Create Resident (Registration)
 * Requires: loginId (user ID) OR mobile (from signup/login)
 * Only users who have signed up/logged in can register as residents
 */
router.post('/', async (req, res) => {
  try {
    const { loginId, mobile, fullName, email, buildingName, flatNumber, ownershipType, idProof } = req.body;

    if (!mobile) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number is required for registration'
      });
    }

    let user = null;
    // If loginId or mobile exists in users collection, fetch user
    if (loginId) {
      user = await User.findById(loginId);
    } else {
      user = await User.findOne({ mobile });
    }

    // Check if resident already exists for this mobile
    const existingResident = await Resident.findOne({ mobile });
    if (existingResident) {
      return res.status(400).json({
        success: false,
        message: 'Resident registration already exists for this mobile number'
      });
    }

    // Create the resident
    const resident = await Resident.create({
      fullName: fullName || (user ? user.username : ''),
      email: email,
      mobile: mobile,
      buildingName: buildingName,
      flatNumber: flatNumber,
      ownershipType: ownershipType,
      idProof: idProof
    });

    // If a user exists, update their registration status
    if (user) {
      user.registrationCompleted = true;
      user.role = 'resident';
      await user.save();
    }

    res.status(201).json({
      success: true,
      message: 'Resident registered successfully',
      data: {
        resident,
        userId: user ? user._id : null,
        mobile: resident.mobile
      }
    });
  } catch (error) {
    console.error('Create resident error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create resident',
      error: error.message
    });
  }
});


/**
 * ✅ Get Resident by Mobile
 */
router.get('/by-mobile/:mobile', async (req, res) => {
  try {
    const resident = await Resident.findOne({ mobile: req.params.mobile });

    if (!resident) {
      return res.status(404).json({
        success: false,
        message: 'Resident not found'
      });
    }

    res.json({
      success: true,
      data: resident
    });
  } catch (error) {
    console.error('Get resident by mobile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * ✅ Get All Residents
 */
router.get('/', async (req, res) => {
  try {
    const residents = await Resident.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      count: residents.length,
      data: residents
    });
  } catch (error) {
    console.error('Get residents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch residents'
    });
  }
});

/**
 * ✅ Get Resident by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const resident = await Resident.findById(req.params.id);

    if (!resident) {
      return res.status(404).json({
        success: false,
        message: 'Resident not found'
      });
    }

    res.json({
      success: true,
      data: resident
    });
  } catch (error) {
    console.error('Get resident by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * ✅ Update Resident
 */
router.put('/:id', async (req, res) => {
  try {
    const resident = await Resident.findByIdAndUpdate(
      req.params.id,
      {
        fullName: req.body.fullName,
        email: req.body.email,
        mobile: req.body.mobile,
        buildingName: req.body.buildingName,
        flatNumber: req.body.flatNumber,
        ownershipType: req.body.ownershipType,
        idProof: req.body.idProof
      },
      { new: true }
    );

    if (!resident) {
      return res.status(404).json({
        success: false,
        message: 'Resident not found'
      });
    }

    res.json({
      success: true,
      message: 'Resident updated successfully',
      data: resident
    });
  } catch (error) {
    console.error('Update resident error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update resident'
    });
  }
});

/**
 * ✅ Delete Resident
 */
router.delete('/:id', async (req, res) => {
  try {
    const resident = await Resident.findByIdAndDelete(req.params.id);

    if (!resident) {
      return res.status(404).json({
        success: false,
        message: 'Resident not found'
      });
    }

    res.json({
      success: true,
      message: 'Resident deleted successfully'
    });
  } catch (error) {
    console.error('Delete resident error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete resident'
    });
  }
});

export default router;
