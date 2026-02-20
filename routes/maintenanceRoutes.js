import express from 'express';
import Maintenance from '../models/Maintenance.js';
import Flat from '../models/Flat.js';
import Resident from '../models/Resident.js';
import Society from '../models/Society.js';
import AddMaintenanceCost from '../models/AddMaintenanceCost.js';
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
        // Search by resident name (if resident exists)
        if (r.resident?.fullName?.toLowerCase().includes(searchLower)) {
          return true;
        }
        // Search by mobile (if resident exists)
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

// Calculate maintenance amount for a flat (based on flat type) - MUST be before /:id
router.get('/calculate-amount', authenticate, async (req, res) => {
  try {
    const { flatId, residentId } = req.query;
    
    if (!flatId && !residentId) {
      return res.status(400).json({
        success: false,
        message: 'Either flatId or residentId is required'
      });
    }

    let flat = null;
    if (flatId) {
      flat = await Flat.findById(flatId).populate('society');
    } else if (residentId) {
      const resident = await Resident.findById(residentId).populate({
        path: 'flat',
        populate: { path: 'society' }
      });
      if (resident && resident.flat) {
        flat = resident.flat;
      }
    }

    if (!flat) {
      return res.status(404).json({
        success: false,
        message: 'Flat not found'
      });
    }

    // Fetch configured rates from AddMaintenanceCost for this society and flat type
    const flatType = flat.flatType || '1BHK';
    let maintenanceCostDoc = await AddMaintenanceCost.findOne({
      society: flat.society._id,
      flatType: flatType,
      isActive: true
    });

    // Fallback to default rates if not configured
    let maintenanceAmount = 1000;
    if (maintenanceCostDoc) {
      maintenanceAmount = maintenanceCostDoc.amount || 1000;
    }

    res.json({
      success: true,
      data: {
        maintenanceAmount: maintenanceAmount,
        flatType: flatType,
        configured: !!maintenanceCostDoc,
        source: maintenanceCostDoc ? 'database' : 'default'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error calculating maintenance amount',
      error: error.message
    });
  }
});
// Delete maintenance record
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const record = await Maintenance.findById(req.params.id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance record not found'
      });
    }

    await Maintenance.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Maintenance record deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting maintenance record',
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
      tower: towerId,
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

    const flat = await Flat.findById(flatId).populate('society').populate('tower');
    if (!flat) {
      return res.status(404).json({ success: false, message: 'Flat not found' });
    }

    if (!req.user || !req.user.societyId) {
      return res.status(401).json({ success: false, message: 'User not properly authenticated' });
    }

    // Resident optional
    let resident = null;
    if (residentId && residentId.trim()) {
      resident = await Resident.findById(residentId).catch(() => null);
    } else if (flat.resident) {
      resident = await Resident.findById(flat.resident).catch(() => null);
    }

    const flatType = flat.flatType;

    // 🔥 Only fetch from AddMaintenanceCost (NO FALLBACK)
    const maintenanceCostDoc = await AddMaintenanceCost.findOne({
      society: flat.society._id,
      flatType: flatType,
      isActive: true
    });

    if (!maintenanceCostDoc) {
      return res.status(400).json({
        success: false,
        message: `Maintenance cost not configured for flat type ${flatType}`
      });
    }

    const maintenanceCharge = maintenanceCostDoc.amount;
    const waterCharge = maintenanceCostDoc.waterCharge || 0;
    const parkingRate = maintenanceCostDoc.parkingCharge || 0;

    const parking = typeof parkingCharge === 'number' ? parkingCharge : parkingRate;
    const amenity = typeof amenityCharge === 'number' ? amenityCharge : 0;

    const otherTotal = Array.isArray(otherCharges)
      ? otherCharges.reduce((s, c) => s + (c.amount || 0), 0)
      : 0;

    const charges = {
      maintenanceCharge,
      waterCharge,
      parkingCharge: parking,
      amenityCharge: amenity,
      penaltyCharge: penaltyCharge || 0,
      otherCharges: Array.isArray(otherCharges) ? otherCharges : []
    };

    const totalAmount =
      maintenanceCharge +
      waterCharge +
      parking +
      amenity +
      (penaltyCharge || 0) +
      otherTotal;

    const payload = {
      society: req.user.societyId,
      tower: towerId || flat.tower?._id || flat.tower,
      flat: flat._id,
      billingPeriod:
        billingPeriod && billingPeriod.month && billingPeriod.year
          ? billingPeriod
          : {
              month: new Date().getMonth() + 1,
              year: new Date().getFullYear()
            },
      charges,
      totalAmount,
      dueDate: dueDate
        ? new Date(dueDate)
        : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 5)
    };

    if (resident) {
      payload.resident = resident._id;
    }

    const record = await Maintenance.create(payload);

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


// Bulk create maintenance bills
router.post('/bulk', authenticate, async (req, res) => {
  try {
    const { month, year, dueDate, charges } = req.body;

    if (!month || !year || !charges) {
      return res.status(400).json({
        success: false,
        message: 'month, year, and charges are required'
      });
    }

    if (!req.user.societyId) {
      return res.status(400).json({
        success: false,
        message: 'User society not found'
      });
    }

    // Get all flats for the user's society
    const flats = await Flat.find({
      society: req.user.societyId,
      isActive: true
    }).populate('society');

    const createdBills = [];
    const errors = [];

    for (const flat of flats) {
      try {
        // Check if bill already exists for this flat and month/year
        const existingBill = await Maintenance.findOne({
          flat: flat._id,
          'billingPeriod.month': parseInt(month),
          'billingPeriod.year': parseInt(year)
        });

        if (existingBill) {
          errors.push({
            flatNo: flat.flatNo,
            message: 'Bill already exists for this month/year'
          });
          continue;
        }

        // Get resident (optional)
        let resident = null;
        if (flat.resident) {
          resident = await Resident.findById(flat.resident).catch(() => null);
        }

        // Calculate total amount
        const totalAmount = (charges.maintenanceCharge || 0) +
          (charges.waterCharge || 0) +
          (charges.parkingCharge || 0) +
          (charges.amenityCharge || 0) +
          (charges.penaltyCharge || 0);

        const billPayload = {
          society: req.user.societyId,
          tower: flat.tower,
          flat: flat._id,
          billingPeriod: {
            month: parseInt(month),
            year: parseInt(year)
          },
          charges,
          totalAmount,
          dueDate: dueDate ? new Date(dueDate) : new Date(year, month, 5)
        };

        // Include resident only if found
        if (resident) {
          billPayload.resident = resident._id;
        }

        const bill = await Maintenance.create(billPayload);

        createdBills.push({
          flatNo: flat.flatNo,
          billId: bill._id,
          totalAmount: bill.totalAmount
        });
      } catch (billErr) {
        errors.push({
          flatNo: flat.flatNo,
          message: billErr.message
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Created ${createdBills.length} bills`,
      data: {
        created: createdBills,
        errors: errors.length > 0 ? errors : undefined,
        summary: {
          total: flats.length,
          created: createdBills.length,
          failed: errors.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating bulk maintenance bills',
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
