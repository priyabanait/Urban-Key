import express from 'express';
import Address from '../models/Address.js';

const router = express.Router();

/* ================= ADD ADDRESS ================= */
router.post('/', async (req, res) => {
  try {
    const {
      residentId,
      addressType,
      flatNumber,
      buildingName,
      tower,
      street,
      area,
      city,
      state,
      postalCode,
      country,
      phone,
      isDefault
    } = req.body;

    if (!residentId) {
      return res.status(400).json({
        success: false,
        message: 'residentId is required'
      });
    }

    if (!city || !state) {
      return res.status(400).json({
        success: false,
        message: 'city and state are required'
      });
    }

    const address = await Address.create({
      residentId,
      addressType,
      flatNumber,
      buildingName,
      tower,
      street,
      area,
      city,
      state,
      postalCode,
      country,
      phone,
      isDefault
    });

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: address
    });
  } catch (error) {
    console.error('Address creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add address',
      error: error.message
    });
  }
});

/* ================= GET ALL ADDRESSES FOR RESIDENT ================= */
router.get('/by-resident/:residentId', async (req, res) => {
  try {
    const { residentId } = req.params;

    const addresses = await Address.find({ residentId })
      .populate('residentId', 'fullName mobile')
      .sort({ isDefault: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Addresses fetched successfully',
      data: addresses
    });
  } catch (error) {
    console.error('Addresses fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch addresses',
      error: error.message
    });
  }
});

/* ================= GET SINGLE ADDRESS ================= */
router.get('/:id', async (req, res) => {
  try {
    const address = await Address.findById(req.params.id);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    res.status(200).json({
      success: true,
      data: address
    });
  } catch (error) {
    console.error('Address fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch address',
      error: error.message
    });
  }
});

/* ================= UPDATE ADDRESS ================= */
router.put('/:id', async (req, res) => {
  try {
    const {
      addressType,
      flatNumber,
      buildingName,
      tower,
      street,
      area,
      city,
      state,
      postalCode,
      country,
      phone,
      isDefault
    } = req.body;

    const address = await Address.findByIdAndUpdate(
      req.params.id,
      {
        addressType,
        flatNumber,
        buildingName,
        tower,
        street,
        area,
        city,
        state,
        postalCode,
        country,
        phone,
        isDefault
      },
      { new: true, runValidators: true }
    );

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      data: address
    });
  } catch (error) {
    console.error('Address update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update address',
      error: error.message
    });
  }
});

/* ================= DELETE ADDRESS ================= */
router.delete('/:id', async (req, res) => {
  try {
    const address = await Address.findByIdAndDelete(req.params.id);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully',
      data: address
    });
  } catch (error) {
    console.error('Address delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete address',
      error: error.message
    });
  }
});

export default router;
