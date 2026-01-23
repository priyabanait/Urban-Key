import express from 'express';
import Visitor from '../models/Visitor.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateVisitor } from '../middleware/validationMiddleware.js';

const router = express.Router();

// Get all visitors
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, visitorType, date } = req.query;
    
    const query = { society: req.user.societyId };
    
    if (status) query.status = status;
    if (visitorType) query.visitorType = visitorType;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.checkInTime = { $gte: startDate, $lte: endDate };
    }
    
    const visitors = await Visitor.find(query)
      .populate('flat', 'flatNo tower')
      .populate('resident', 'name')
      .populate('securityGuard', 'name')
      .sort({ checkInTime: -1 });
    
    res.json({
      success: true,
      count: visitors.length,
      data: visitors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching visitors',
      error: error.message
    });
  }
});

// Get single visitor
router.get('/:id', authenticate, async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id)
      .populate('flat', 'flatNo tower')
      .populate('resident', 'name phone')
      .populate('securityGuard', 'name');
    
    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: 'Visitor not found'
      });
    }

    res.json({
      success: true,
      data: visitor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching visitor',
      error: error.message
    });
  }
});

// Create visitor entry
router.post('/', authenticate, validateVisitor, async (req, res) => {
  try {
    const visitor = await Visitor.create({
      ...req.body,
      society: req.user.societyId,
      securityGuard: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Visitor entry created successfully',
      data: visitor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating visitor entry',
      error: error.message
    });
  }
});

// Update visitor status
router.put('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    
    const updateData = { status };
    if (status === 'Checked Out') {
      updateData.checkOutTime = new Date();
    }
    
    const visitor = await Visitor.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: 'Visitor not found'
      });
    }

    res.json({
      success: true,
      message: 'Visitor status updated successfully',
      data: visitor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating visitor',
      error: error.message
    });
  }
});

// Check out visitor
router.put('/:id/checkout', authenticate, async (req, res) => {
  try {
    const visitor = await Visitor.findByIdAndUpdate(
      req.params.id,
      { 
        checkOutTime: new Date(),
        status: 'Checked Out'
      },
      { new: true }
    );

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: 'Visitor not found'
      });
    }

    res.json({
      success: true,
      message: 'Visitor checked out successfully',
      data: visitor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking out visitor',
      error: error.message
    });
  }
});

export default router;
