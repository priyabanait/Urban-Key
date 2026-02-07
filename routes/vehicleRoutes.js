import express from 'express';
import Vehicle from '../models/Vehicle.js';

const router = express.Router();

/* ================= ADD VEHICLE ================= */
router.post('/', async (req, res) => {
  try {
    const {
      residentId,
      vehicleType,
      vehicleNumber,
      registrationNumber,
      color,
      manufacturer,
      parkingSlotNumber
    } = req.body;

    if (!residentId) {
      return res.status(400).json({
        success: false,
        message: 'residentId is required'
      });
    }

    if (!vehicleType || !vehicleNumber) {
      return res.status(400).json({
        success: false,
        message: 'vehicleType and vehicleNumber are required'
      });
    }

    const vehicle = await Vehicle.create({
      residentId,
      vehicleType,
      vehicleNumber: vehicleNumber.toUpperCase(),
      registrationNumber,
      color,
      manufacturer,
      parkingSlotNumber
    });

    res.status(201).json({
      success: true,
      message: 'Vehicle added successfully',
      data: vehicle
    });
  } catch (error) {
    console.error('Vehicle creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add vehicle',
      error: error.message
    });
  }
});

/* ================= GET ALL VEHICLES FOR RESIDENT ================= */
router.get('/by-resident/:residentId', async (req, res) => {
  try {
    const { residentId } = req.params;

    const vehicles = await Vehicle.find({ residentId })
      .populate('residentId', 'fullName mobile')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Vehicles fetched successfully',
      data: vehicles
    });
  } catch (error) {
    console.error('Vehicles fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicles',
      error: error.message
    });
  }
});

/* ================= GET SINGLE VEHICLE ================= */
router.get('/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    res.status(200).json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    console.error('Vehicle fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicle',
      error: error.message
    });
  }
});

/* ================= UPDATE VEHICLE ================= */
router.put('/:id', async (req, res) => {
  try {
    const {
      vehicleType,
      vehicleNumber,
      registrationNumber,
      color,
      manufacturer,
      parkingSlotNumber
    } = req.body;

    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      {
        vehicleType,
        vehicleNumber: vehicleNumber?.toUpperCase(),
        registrationNumber,
        color,
        manufacturer,
        parkingSlotNumber
      },
      { new: true, runValidators: true }
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully',
      data: vehicle
    });
  } catch (error) {
    console.error('Vehicle update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update vehicle',
      error: error.message
    });
  }
});

/* ================= DELETE VEHICLE ================= */
router.delete('/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Vehicle deleted successfully',
      data: vehicle
    });
  } catch (error) {
    console.error('Vehicle delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete vehicle',
      error: error.message
    });
  }
});

export default router;
