import express from 'express';
import Resident from '../models/Resident.js';
import User from '../models/user.js';

const router = express.Router();

/* ================= CREATE RESIDENT ================= */
router.post('/', async (req, res) => {
  try {
    const {
      loginId,
      fullName,
      city,
      society,
      email,
      phone,
      mobile,
      tower,
      flatNumber,
      residentType,
      ownershipType,
      moveInDate,
      emergencyContact,
      idProof,
      photo
    } = req.body;

    const finalMobile = mobile || phone;

    // Normalize ownership type
    let finalOwnership = ownershipType || residentType || 'Owner';
    finalOwnership =
      finalOwnership.toLowerCase() === 'tenant' ? 'Tenant' : 'Owner';

    /* -------- REQUIRED FIELD CHECK -------- */
    if (!fullName || !finalMobile || !city || !society || !flatNumber) {
      return res.status(400).json({
        success: false,
        message: 'fullName, mobile, city, society and flatNumber are required'
      });
    }

    /* -------- FIND USER (OPTIONAL) -------- */
    let user = null;
    if (loginId) {
      user = await User.findById(loginId);
    } else {
      user = await User.findOne({ mobile: finalMobile });
    }

    /* -------- DUPLICATE CHECK -------- */
    const existingResident = await Resident.findOne({ mobile: finalMobile });
    if (existingResident) {
      return res.status(400).json({
        success: false,
        message: 'Resident already exists for this mobile number'
      });
    }

    /* -------- CREATE RESIDENT -------- */
    const resident = await Resident.create({
      fullName,
      email,
      mobile: finalMobile,
      city,
      society,
      tower,
      flatNumber,
      ownershipType: finalOwnership,
      moveInDate,
      emergencyContact,
      idProof,
      photo
    });

    /* -------- UPDATE USER (IF EXISTS) -------- */
    if (user) {
      user.registrationCompleted = true;
      user.role = 'resident';
      await user.save();
    }

    return res.status(201).json({
      success: true,
      message: 'Resident added successfully',
      data: resident
    });
  } catch (error) {
    console.error('CREATE RESIDENT ERROR:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create resident'
    });
  }
});

/* ================= GET ALL RESIDENTS ================= */
router.get('/', async (req, res) => {
  try {
    const residents = await Resident.find({})
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: residents.length,
      data: residents
    });
  } catch (error) {
    console.error('GET RESIDENTS ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch residents'
    });
  }
});

/* ================= GET RESIDENT BY ID ================= */
router.get('/:id', async (req, res) => {
  try {
    const resident = await Resident.findById(req.params.id);
    if (!resident) {
      return res.status(404).json({
        success: false,
        message: 'Resident not found'
      });
    }

    return res.json({
      success: true,
      data: resident
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Invalid resident ID'
    });
  }
});

/* ================= UPDATE RESIDENT ================= */
router.put('/:id', async (req, res) => {
  try {
    const updatedResident = await Resident.findByIdAndUpdate(
      req.params.id,
      req.body, // supports city, society, photo, etc.
      { new: true, runValidators: true }
    );

    if (!updatedResident) {
      return res.status(404).json({
        success: false,
        message: 'Resident not found'
      });
    }

    return res.json({
      success: true,
      message: 'Resident updated successfully',
      data: updatedResident
    });
  } catch (error) {
    console.error('UPDATE RESIDENT ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Update failed'
    });
  }
});

/* ================= DELETE RESIDENT ================= */
router.delete('/:id', async (req, res) => {
  try {
    const deletedResident = await Resident.findByIdAndDelete(req.params.id);

    if (!deletedResident) {
      return res.status(404).json({
        success: false,
        message: 'Resident not found'
      });
    }

    return res.json({
      success: true,
      message: 'Resident deleted successfully'
    });
  } catch (error) {
    console.error('DELETE RESIDENT ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Delete failed'
    });
  }
});

export default router;
