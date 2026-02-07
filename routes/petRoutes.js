import express from 'express';
import Pet from '../models/Pet.js';

const router = express.Router();

/* ================= ADD PET ================= */
router.post('/', async (req, res) => {
  try {
    const {
      residentId,
      petName,
      petType,
      breed,
      color,
      age,
      vaccinated,
      vaccineExpiry,
      registrationNumber,
      photo
    } = req.body;

    if (!residentId) {
      return res.status(400).json({
        success: false,
        message: 'residentId is required'
      });
    }

    if (!petName || !petType) {
      return res.status(400).json({
        success: false,
        message: 'petName and petType are required'
      });
    }

    const pet = await Pet.create({
      residentId,
      petName,
      petType,
      breed,
      color,
      age,
      vaccinated,
      vaccineExpiry,
      registrationNumber,
      photo
    });

    res.status(201).json({
      success: true,
      message: 'Pet added successfully',
      data: pet
    });
  } catch (error) {
    console.error('Pet creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add pet',
      error: error.message
    });
  }
});

/* ================= GET ALL PETS FOR RESIDENT ================= */
router.get('/by-resident/:residentId', async (req, res) => {
  try {
    const { residentId } = req.params;

    const pets = await Pet.find({ residentId })
      .populate('residentId', 'fullName mobile')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Pets fetched successfully',
      data: pets
    });
  } catch (error) {
    console.error('Pets fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pets',
      error: error.message
    });
  }
});

/* ================= GET SINGLE PET ================= */
router.get('/:id', async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    res.status(200).json({
      success: true,
      data: pet
    });
  } catch (error) {
    console.error('Pet fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pet',
      error: error.message
    });
  }
});

/* ================= UPDATE PET ================= */
router.put('/:id', async (req, res) => {
  try {
    const {
      petName,
      petType,
      breed,
      color,
      age,
      vaccinated,
      vaccineExpiry,
      registrationNumber,
      photo
    } = req.body;

    const pet = await Pet.findByIdAndUpdate(
      req.params.id,
      {
        petName,
        petType,
        breed,
        color,
        age,
        vaccinated,
        vaccineExpiry,
        registrationNumber,
        photo
      },
      { new: true, runValidators: true }
    );

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Pet updated successfully',
      data: pet
    });
  } catch (error) {
    console.error('Pet update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update pet',
      error: error.message
    });
  }
});

/* ================= DELETE PET ================= */
router.delete('/:id', async (req, res) => {
  try {
    const pet = await Pet.findByIdAndDelete(req.params.id);

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Pet deleted successfully',
      data: pet
    });
  } catch (error) {
    console.error('Pet delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete pet',
      error: error.message
    });
  }
});

export default router;
