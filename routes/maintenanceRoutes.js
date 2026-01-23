import express from 'express';
import Maintenance from '../models/Maintenance.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all maintenance records
router.get('/', authenticate, async (req, res) => {
  try {
    const { paymentStatus, month, year } = req.query;
    
    const query = { society: req.user.societyId };
    
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (month) query['billingPeriod.month'] = parseInt(month);
    if (year) query['billingPeriod.year'] = parseInt(year);
    
    const records = await Maintenance.find(query)
      .populate('flat', 'flatNo tower')
      .populate('resident', 'name email phone')
      .sort({ 'billingPeriod.year': -1, 'billingPeriod.month': -1 });
    
    res.json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching maintenance records',
      error: error.message
    });
  }
});

// Get single maintenance record
router.get('/:id', authenticate, async (req, res) => {
  try {
    const record = await Maintenance.findById(req.params.id)
      .populate('flat', 'flatNo tower')
      .populate('resident', 'name email phone');
    
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance record not found'
      });
    }

    res.json({
      success: true,
      data: record
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching maintenance record',
      error: error.message
    });
  }
});

// Create maintenance bill
router.post('/', authenticate, async (req, res) => {
  try {
    const record = await Maintenance.create({
      ...req.body,
      society: req.user.societyId
    });

    res.status(201).json({
      success: true,
      message: 'Maintenance bill created successfully',
      data: record
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating maintenance bill',
      error: error.message
    });
  }
});

// Record payment
router.put('/:id/payment', authenticate, async (req, res) => {
  try {
    const { paidAmount, paymentMode, transactionId } = req.body;
    
    const record = await Maintenance.findById(req.params.id);
    
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance record not found'
      });
    }

    record.paidAmount = paidAmount;
    record.paymentMode = paymentMode;
    record.transactionId = transactionId;
    record.paymentDate = new Date();
    
    if (paidAmount >= record.totalAmount) {
      record.paymentStatus = 'Paid';
    } else if (paidAmount > 0) {
      record.paymentStatus = 'Partial';
    }

    await record.save();

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      data: record
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error recording payment',
      error: error.message
    });
  }
});

// Get payment summary
router.get('/stats/summary', authenticate, async (req, res) => {
  try {
    const { month, year } = req.query;
    
    const query = { society: req.user.societyId };
    if (month) query['billingPeriod.month'] = parseInt(month);
    if (year) query['billingPeriod.year'] = parseInt(year);
    
    const records = await Maintenance.find(query);
    
    const totalBilled = records.reduce((sum, r) => sum + r.totalAmount, 0);
    const totalCollected = records.reduce((sum, r) => sum + r.paidAmount, 0);
    const pending = totalBilled - totalCollected;
    
    const paidCount = records.filter(r => r.paymentStatus === 'Paid').length;
    const pendingCount = records.filter(r => r.paymentStatus === 'Pending').length;
    const overdueCount = records.filter(r => r.paymentStatus === 'Overdue').length;

    res.json({
      success: true,
      data: {
        totalBilled,
        totalCollected,
        pending,
        paidCount,
        pendingCount,
        overdueCount,
        collectionRate: totalBilled > 0 ? ((totalCollected / totalBilled) * 100).toFixed(2) : 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching summary',
      error: error.message
    });
  }
});

export default router;
