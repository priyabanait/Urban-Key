import express from 'express';
import Maintenance from '../models/Maintenance.js';
import Flat from '../models/Flat.js';
import Resident from '../models/Resident.js';
import Society from '../models/Society.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all maintenance records
router.get('/', authenticate, async (req, res) => {
  try {
    const { paymentStatus, month, year, society, search } = req.query;
    
    // If society query param is provided, use it; otherwise use authenticated user's society
    const query = {};
    if (society) {
      query.society = society;
    } else if (req.user.societyId) {
      query.society = req.user.societyId;
    }
    
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (month) query['billingPeriod.month'] = parseInt(month);
    if (year) query['billingPeriod.year'] = parseInt(year);
    
    const records = await Maintenance.find(query)
      .populate({
        path: 'flat',
        select: 'flatNo tower',
        populate: {
          path: 'tower',
          select: 'name'
        }
      })
      .populate('resident', 'fullName email mobile')
      .populate('society', 'name')
      .sort({ 'billingPeriod.year': -1, 'billingPeriod.month': -1 });
    
    // Filter by search query (flat number, resident name, or mobile)
    let filteredRecords = records;
    if (search && search.trim()) {
      const searchLower = search.toLowerCase();
      filteredRecords = records.filter(r => {
        // Search by flat number
        if (r.flat?.flatNo?.toString().toLowerCase().includes(searchLower)) {
          return true;
        }
        // Search by resident name
        if (r.resident?.fullName?.toLowerCase().includes(searchLower)) {
          return true;
        }
        // Search by mobile
        if (r.resident?.mobile?.includes(search)) {
          return true;
        }
        return false;
      });
    }
    
    res.json({
      success: true,
      count: filteredRecords.length,
      data: filteredRecords
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching maintenance records',
      error: error.message
    });
  }
});

// Get payment summary - MUST come before /:id
router.get('/stats/summary', authenticate, async (req, res) => {
  try {
    const { month, year, society } = req.query;
    
    // If society query param is provided, use it; otherwise use authenticated user's society
    const query = {};
    if (society) {
      query.society = society;
    } else if (req.user.societyId) {
      query.society = req.user.societyId;
    }
    
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

// Get single maintenance record
router.get('/:id', authenticate, async (req, res) => {
  try {
    const record = await Maintenance.findById(req.params.id)
      .populate({
        path: 'flat',
        select: 'flatNo tower',
        populate: {
          path: 'tower',
          select: 'name'
        }
      })
      .populate('resident', 'fullName email mobile')
      .populate('society', 'name');
    
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
    const {
      flat: flatId,
      resident: residentId,
      billingPeriod,
      parkingCharge,
      amenityCharge,
      penaltyCharge = 0,
      otherCharges = [],
      dueDate
    } = req.body;

    if (!flatId) {
      return res.status(400).json({ success: false, message: 'Flat id is required' });
    }

    const flat = await Flat.findById(flatId).populate('society');
    if (!flat) {
      return res.status(404).json({ success: false, message: 'Flat not found' });
    }

    // Ensure maintenance is created for the same society as authenticated user
    if (req.user && req.user.societyId && flat.society && flat.society._id.toString() !== req.user.societyId.toString()) {
      return res.status(403).json({ success: false, message: 'Flat does not belong to your society' });
    }

    // Determine resident
    let resident = null;
    if (residentId) resident = await Resident.findById(residentId);
    if (!resident && flat.resident) resident = await Resident.findById(flat.resident);

    // Default rates per flat type (can be moved to DB later)
    const typeRates = {
      '1BHK': { maintenance: 1000, water: 200, parking: 0 },
      '2BHK': { maintenance: 1500, water: 300, parking: 0 },
      '3BHK': { maintenance: 2000, water: 400, parking: 0 },
      '4BHK': { maintenance: 2500, water: 500, parking: 0 },
      '5BHK': { maintenance: 3000, water: 600, parking: 0 },
      'Penthouse': { maintenance: 5000, water: 800, parking: 0 },
      'Studio': { maintenance: 800, water: 150, parking: 0 }
    };

    const flatType = flat.flatType || '1BHK';
    const rates = typeRates[flatType] || typeRates['1BHK'];

    const maintenanceCharge = rates.maintenance;
    const waterCharge = rates.water;
    const parking = typeof parkingCharge === 'number' ? parkingCharge : rates.parking;
    const amenity = typeof amenityCharge === 'number' ? amenityCharge : 0;

    const otherTotal = Array.isArray(otherCharges) ? otherCharges.reduce((s, c) => s + (c.amount || 0), 0) : 0;

    const charges = {
      maintenanceCharge,
      waterCharge,
      parkingCharge: parking,
      amenityCharge: amenity,
      penaltyCharge: penaltyCharge || 0,
      otherCharges: Array.isArray(otherCharges) ? otherCharges : []
    };

    const totalAmount = maintenanceCharge + waterCharge + parking + amenity + (penaltyCharge || 0) + otherTotal;

    // Always use authenticated user's society (ensures consistency with GET filter)
    if (!req.user.societyId) {
      return res.status(400).json({ success: false, message: 'User society not found' });
    }

    const record = await Maintenance.create({
      society: req.user.societyId,
      flat: flat._id,
      resident: resident ? resident._id : (req.user._id || null),
      billingPeriod: billingPeriod || {
        month: (new Date()).getMonth() + 1,
        year: (new Date()).getFullYear()
      },
      charges,
      totalAmount,
      dueDate: dueDate ? new Date(dueDate) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 5) // default 5th of next month
    });

    res.status(201).json({ success: true, message: 'Maintenance bill created successfully', data: record });
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

export default router;
