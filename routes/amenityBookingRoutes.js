import express from 'express';
import mongoose from 'mongoose';
import AmenityBooking from '../models/AmenityBooking.js';
import Amenity from '../models/Amenity.js';
import Resident from '../models/Resident.js';
import FamilyMember from '../models/FamilyMember.js';
import Flat from '../models/Flat.js';
import Tower from '../models/Tower.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * Create a new amenity booking
 * POST /api/amenity-bookings
 * 
 * Required fields:
 * - amenityId: string (ObjectId of the amenity)
 * - bookingDate: string (YYYY-MM-DD format)
 * - startTime: string (HH:MM format)
 * - endTime: string (HH:MM format)
 * - buildingName: string (Tower/Building name)
 * - flatNo: string (Flat number)
 * - personName: string (Name of the person booking)
 * 
 * Optional fields:
 * - purpose: string
 * - numberOfGuests: number
 */
router.post('/', async (req, res) => {
  try {
    // ---------------- BODY CHECK ----------------
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Request body is empty'
      });
    }

    const {
      amenityId,
      bookingDate,
      startTime,
      endTime,
      purpose,
      numberOfGuests,
      buildingName,
      flatNo,
      personName
    } = req.body;

    // ---------------- VALIDATION ----------------
    const missing = [];
    if (!amenityId) missing.push('amenityId');
    if (!bookingDate) missing.push('bookingDate');
    if (!startTime) missing.push('startTime');
    if (!endTime) missing.push('endTime');
    if (!buildingName) missing.push('buildingName');
    if (!flatNo) missing.push('flatNo');
    if (!personName) missing.push('personName');

    if (missing.length) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        missing
      });
    }

    // Validate amenityId format
    if (!mongoose.Types.ObjectId.isValid(amenityId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amenityId format. Please provide a valid MongoDB ObjectId.',
        receivedId: amenityId
      });
    }

    let flatId;
    let societyId;
    let bookedByType = 'Resident';
    let bookedById = null;

    // ---------------- FIND TOWER BY NAME ----------------
    const tower = await Tower.findOne({ name: buildingName });
    if (!tower) {
      return res.status(404).json({ 
        success: false, 
        message: `Building/Tower not found with name: ${buildingName}` 
      });
    }

    // ---------------- FIND FLAT BY TOWER AND FLAT NUMBER ----------------
    const flat = await Flat.findOne({ 
      flatNo: flatNo,
      tower: tower._id
    });
    if (!flat) {
      return res.status(404).json({ 
        success: false, 
        message: `Flat ${flatNo} not found in building ${buildingName}` 
      });
    }

    flatId = flat._id;
    societyId = flat.society;

    // ---------------- CHECK IF PERSON IS RESIDENT OR FAMILY MEMBER ----------------
    // First check if resident exists for this flat
    if (flat.resident) {
      const resident = await Resident.findById(flat.resident);
      if (resident && resident.fullName.toLowerCase() === personName.toLowerCase()) {
        bookedByType = 'Resident';
        bookedById = resident._id;
      } else {
        // Check if it's a family member
        const familyMember = await FamilyMember.findOne({
          resident: flat.resident,
          name: { $regex: new RegExp(`^${personName}$`, 'i') },
          isApproved: true
        });
        
        if (familyMember) {
          bookedByType = 'FamilyMember';
          bookedById = familyMember._id;
        }
      }
    }

    // If no match found, reject the booking if there's no resident
    if (!bookedById) {
      if (!flat.resident) {
        return res.status(400).json({ 
          success: false, 
          message: `No resident found for flat ${flatNo} in building ${buildingName}. Please ensure a resident is registered for this flat before booking.` 
        });
      }
      // Use the flat's resident as default
      bookedByType = 'Resident';
      bookedById = flat.resident;
    }

    // ---------------- AMENITY ----------------
    const amenity = await Amenity.findById(amenityId);
    if (!amenity || !amenity.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Amenity not found or inactive'
      });
    }

    // ---------------- TIME VALIDATION ----------------
    const start = new Date(`1970-01-01T${startTime}`);
    const end = new Date(`1970-01-01T${endTime}`);
    const duration = (end - start) / (1000 * 60 * 60);

    if (duration <= 0) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time'
      });
    }

    // ---------------- CREATE BOOKING ----------------
    const booking = await AmenityBooking.create({
      amenity: amenityId,
      society: societyId,
      flat: flatId,
      bookedBy: {
        userType: bookedByType,
        userId: bookedById,
        name: personName
      },
      bookingDate,
      startTime,
      endTime,
      duration,
      purpose,
      numberOfGuests,
      status: 'Pending'
    });

    res.status(201).json({
      success: true,
      message: 'Amenity booking created successfully',
      data: booking
    });

  } catch (error) {
    console.error('❌ Booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: error.message
    });
  }
});


/**
 * Get all bookings (with filters)
 * GET /api/amenity-bookings
 */
router.get('/', async (req, res) => {
  try {
    const {
      societyId,
      amenityId,
      status,
      startDate,
      endDate,
      flatId
    } = req.query;

    // societyId is mandatory now
    if (!societyId) {
      return res.status(400).json({
        success: false,
        message: 'societyId is required'
      });
    }

    const query = { society: societyId };

    if (amenityId) query.amenity = amenityId;
    if (status) query.status = status;
    if (flatId) query.flat = flatId;

    if (startDate || endDate) {
      query.bookingDate = {};
      if (startDate) query.bookingDate.$gte = new Date(startDate);
      if (endDate) query.bookingDate.$lte = new Date(endDate);
    }

    const bookings = await AmenityBooking.find(query)
      .populate('amenity', 'name type location')
      .populate('flat', 'flatNo tower')
      .populate('bookedBy.userId', 'name fullName')
      .populate('approvedBy', 'name')
      .sort({ bookingDate: -1, startTime: -1 });

    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });

  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message
    });
  }
});


/**
 * Get bookings for a specific user (resident or family member) - Authenticated
 * GET /api/amenity-bookings/my-bookings
 */
router.get('/my-bookings', authenticate, async (req, res) => {
  try {
    const { societyId } = req.query;

    // Validate required params
    if (!societyId) {
      return res.status(400).json({
        success: false,
        message: 'societyId is required'
      });
    }

    let userType;
    let userId;

    // Determine user type from authenticated token
    if (req.user.type === 'family_member') {
      userType = 'FamilyMember';
      userId = req.user.id;
    } else if (req.user.type === 'resident' || req.user.role === 'resident') {
      // Find resident by mobile
      const resident = await Resident.findOne({ mobile: req.user.mobile });
      if (!resident) {
        return res.status(404).json({
          success: false,
          message: 'Resident not found'
        });
      }
      userType = 'Resident';
      userId = resident._id;
    } else {
      return res.status(403).json({
        success: false,
        message: 'Invalid user type'
      });
    }

    const bookings = await AmenityBooking.find({
      society: societyId,
      'bookedBy.userType': userType,
      'bookedBy.userId': userId
    })
      .populate('amenity', 'name type location')
      .populate('flat', 'flatNo tower')
      .sort({ bookingDate: -1, startTime: -1 });

    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });

  } catch (error) {
    console.error('Get my bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message
    });
  }
});

/**
 * Get single booking
 * GET /api/amenity-bookings/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const booking = await AmenityBooking.findById(req.params.id)
      .populate('amenity')
      .populate('flat', 'flatNo tower')
      .populate('bookedBy.userId')
      .populate('approvedBy', 'name');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Fetch booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching booking',
      error: error.message
    });
  }
});


/**
 * Update booking status (Approve/Reject)
 * PUT /api/amenity-bookings/:id/status
 */
router.put('/:id/status', async (req, res) => {
  try {
    const { status, rejectionReason, notes, approvedBy } = req.body;

    // Validate status
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be Approved or Rejected'
      });
    }

    const booking = await AmenityBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot update booking with status: ${booking.status}`
      });
    }

    // Update status
    booking.status = status;

    if (status === 'Approved') {
      booking.approvedBy = approvedBy || null; // Optional
      booking.approvedAt = new Date();
    } else if (status === 'Rejected') {
      booking.rejectionReason = rejectionReason;
    }

    if (notes) booking.notes = notes;

    await booking.save();

    await booking.populate([
      { path: 'amenity', select: 'name type' },
      { path: 'flat', select: 'flatNo tower' },
      { path: 'bookedBy.userId' }
    ]);

    res.json({
      success: true,
      message: `Booking ${status.toLowerCase()} successfully`,
      data: booking
    });

  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating booking status',
      error: error.message
    });
  }
});


/**
 * Cancel booking
 * PUT /api/amenity-bookings/:id/cancel
 */
router.put('/:id/cancel', async (req, res) => {
  try {
    const { cancellationReason } = req.body;

    const booking = await AmenityBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (!['Pending', 'Approved'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel booking with status: ${booking.status}`
      });
    }

    booking.status = 'Cancelled';
    booking.cancellationReason = cancellationReason || '';
    booking.cancelledAt = new Date();

    await booking.save();

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });

  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling booking',
      error: error.message
    });
  }
});


/**
 * Get available time slots for a specific amenity and date
 * GET /api/amenity-bookings/available-slots/:amenityId
 */
router.get('/available-slots/:amenityId', async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    const amenity = await Amenity.findById(req.params.amenityId);
    if (!amenity) {
      return res.status(404).json({
        success: false,
        message: 'Amenity not found'
      });
    }

    // Get all bookings for this amenity on this date
    const bookings = await AmenityBooking.find({
      amenity: req.params.amenityId,
      bookingDate: new Date(date),
      status: { $in: ['Pending', 'Approved'] }
    }).select('startTime endTime');

    res.json({
      success: true,
      data: {
        amenity: {
          name: amenity.name,
          timings: amenity.timings
        },
        bookedSlots: bookings,
        date
      }
    });

  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching available slots',
      error: error.message
    });
  }
});


export default router;
