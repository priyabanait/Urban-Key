import express from 'express';
import DailyHelp from '../models/DailyHelp.js';

const router = express.Router();

/* ================= ADD DAILY HELP ================= */
router.post('/', async (req, res) => {
  try {
    const {
      residentId,
      helperName,
      helperType,
      phone,
      email,
      workingDays,
      workingHours,
      salary,
      aadharNumber,
      address,
      documents,
      isVerified
    } = req.body;

    if (!residentId) {
      return res.status(400).json({
        success: false,
        message: 'residentId is required'
      });
    }

    if (!helperName || !helperType) {
      return res.status(400).json({
        success: false,
        message: 'helperName and helperType are required'
      });
    }

    const helper = await DailyHelp.create({
      residentId,
      helperName,
      helperType,
      phone,
      email,
      workingDays,
      workingHours,
      salary,
      aadharNumber,
      address,
      documents,
      isVerified
    });

    res.status(201).json({
      success: true,
      message: 'Daily help added successfully',
      data: helper
    });
  } catch (error) {
    console.error('Daily help creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add daily help',
      error: error.message
    });
  }
});

/* ================= GET ALL DAILY HELP FOR RESIDENT ================= */
router.get('/by-resident/:residentId', async (req, res) => {
  try {
    const { residentId } = req.params;

    const helpers = await DailyHelp.find({ residentId })
      .populate('residentId', 'fullName mobile')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Daily help fetched successfully',
      data: helpers
    });
  } catch (error) {
    console.error('Daily help fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch daily help',
      error: error.message
    });
  }
});

/* ================= GET SINGLE DAILY HELP ================= */
router.get('/:id', async (req, res) => {
  try {
    const helper = await DailyHelp.findById(req.params.id);

    if (!helper) {
      return res.status(404).json({
        success: false,
        message: 'Daily help not found'
      });
    }

    res.status(200).json({
      success: true,
      data: helper
    });
  } catch (error) {
    console.error('Daily help fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch daily help',
      error: error.message
    });
  }
});

/* ================= UPDATE DAILY HELP ================= */
router.put('/:id', async (req, res) => {
  try {
    const {
      helperName,
      helperType,
      phone,
      email,
      workingDays,
      workingHours,
      salary,
      aadharNumber,
      address,
      documents,
      isVerified
    } = req.body;

    const helper = await DailyHelp.findByIdAndUpdate(
      req.params.id,
      {
        helperName,
        helperType,
        phone,
        email,
        workingDays,
        workingHours,
        salary,
        aadharNumber,
        address,
        documents,
        isVerified
      },
      { new: true, runValidators: true }
    );

    if (!helper) {
      return res.status(404).json({
        success: false,
        message: 'Daily help not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Daily help updated successfully',
      data: helper
    });
  } catch (error) {
    console.error('Daily help update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update daily help',
      error: error.message
    });
  }
});

/* ================= DELETE DAILY HELP ================= */
router.delete('/:id', async (req, res) => {
  try {
    const helper = await DailyHelp.findByIdAndDelete(req.params.id);

    if (!helper) {
      return res.status(404).json({
        success: false,
        message: 'Daily help not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Daily help deleted successfully',
      data: helper
    });
  } catch (error) {
    console.error('Daily help delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete daily help',
      error: error.message
    });
  }
});

export default router;
