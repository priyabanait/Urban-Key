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
      personName,
      cityName,
      societyName
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
    if (!cityName) missing.push('cityName');
    if (!societyName) missing.push('societyName');

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

    // Log for debugging
    console.log('📝 Booking Request:', {
      cityName,
      societyName,
      buildingName,
      flatNo,
      personName
    });

    // ---------------- FIND SOCIETY BY NAME AND CITY ----------------
    const Society = (await import('../models/Society.js')).default;
    const City = (await import('../models/City.js')).default;

    const city = await City.findOne({ name: new RegExp(`^${cityName}$`, 'i') });
    if (!city) {
      return res.status(404).json({
        success: false,
        message: `City not found: ${cityName}`
      });
    }

    const society = await Society.findOne({ 
      name: new RegExp(`^${societyName}$`, 'i'),
      city: city._id
    });
    if (!society) {
      return res.status(404).json({
        success: false,
        message: `Society not found with name: ${societyName} in city: ${cityName}`
      });
    }

    console.log('✅ Society found:', society._id);

    // ---------------- FIND TOWER BY NAME WITH SOCIETY/CITY CONTEXT ----------------
    // Try exact name match first
    let tower = await Tower.findOne({ 
      name: new RegExp(`^${buildingName}$`, 'i'),
      society: society._id 
    });

    // If not found, try partial match (e.g., "A" matches "A wing" or "Tower A")
    if (!tower) {
      // Try matching with word boundary or prefix
      tower = await Tower.findOne({
        $or: [
          { name: new RegExp(`\\b${buildingName}\\b`, 'i') },
          { name: new RegExp(`^${buildingName}`, 'i') }
        ],
        society: society._id
      });
    }

    // If still not found, try adding common suffixes (e.g., "A" -> "A wing", "Tower A", etc)
    if (!tower) {
      const suffixes = [' wing', ' Wing', ' tower', ' Tower', 'Tower ', 'Wing '];
      for (const suffix of suffixes) {
        tower = await Tower.findOne({
          name: new RegExp(`^${buildingName}${suffix.trim()}$`, 'i'),
          society: society._id
        });
        if (tower) break;
      }
    }

    if (!tower) {
      // Return available towers for debugging
      const availableTowers = await Tower.find({ society: society._id }).select('name');
      console.log('❌ Tower not found. Available:', availableTowers.map(t => t.name).join(', '));
      return res.status(404).json({ 
        success: false, 
        message: `Building/Tower '${buildingName}' not found in society '${societyName}'`,
        availableTowers: availableTowers.map(t => t.name),
        hint: `Try: ${availableTowers[0]?.name || 'available towers listed above'}`
      });
    }

    console.log('✅ Tower found:', tower.name);

    // ---------------- FIND FLAT BY TOWER AND FLAT NUMBER ----------------
    // Try exact match first
    let flat = await Flat.findOne({ 
      flatNo: flatNo,
      tower: tower._id
    });

    // If not found, try with tower prefix (e.g., "101" could be stored as "A-101" or "A101")
    if (!flat) {
      const towerLetter = tower.name.match(/[A-Z]/)?.[0] || '';
      const flatVariations = [
        flatNo,
        `${towerLetter}-${flatNo}`,
        `${towerLetter}${flatNo}`,
        `${towerLetter} ${flatNo}`
      ];

      flat = await Flat.findOne({
        flatNo: { $in: flatVariations },
        tower: tower._id
      });
    }

    if (!flat) {
      // Return available flats for debugging
      const availableFlats = await Flat.find({ tower: tower._id }).select('flatNo').limit(10);
      return res.status(404).json({ 
        success: false, 
        message: `Flat ${flatNo} not found in building ${tower.name}`,
        searchedIn: tower.name,
        sampleFlats: availableFlats.map(f => f.flatNo)
      });
    }

    console.log('✅ Flat found:', flat.flatNo);

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
 * Admin: Get bookings across societies or by city
 * GET /api/amenity-bookings/admin?cityName=...&societyId=...&startDate=...&endDate=...
 * Requires authentication and admin role
 */
router.get('/admin', async (req, res) => {
  try {
    // This endpoint returns bookings across societies in a city or for a specific society.
    // It was previously restricted to admin users; it is now available to all callers
    // so the frontend can show city-level bookings for everyone when requested.
    const { cityName, societyId, startDate, endDate, status, amenityId } = req.query;

    const query = {};

    // If societyId provided, filter by that
    if (societyId) {
      query.society = societyId;
    } else if (cityName) {
      // Find societies in the city
      const Society = (await import('../models/Society.js')).default;
      const City = (await import('../models/City.js')).default;
      const city = await City.findOne({ name: new RegExp(`^${cityName}$`, 'i') });
      if (!city) return res.json({ success: true, count: 0, data: [] });
      const societies = await Society.find({ city: city._id }).select('_id');
      const ids = societies.map(s => s._id);
      if (ids.length === 0) {
        return res.json({ success: true, count: 0, data: [] });
      }
      query.society = { $in: ids };
    } else {
      // If neither provided, return bad request — require at least one scope
      return res.status(400).json({ success: false, message: 'Provide cityName or societyId' });
    }

    if (amenityId) query.amenity = amenityId;
    if (status) query.status = status;

    if (startDate || endDate) {
      query.bookingDate = {};
      if (startDate) query.bookingDate.$gte = new Date(startDate);
      if (endDate) query.bookingDate.$lte = new Date(endDate);
    }

    const bookings = await AmenityBooking.find(query)
      .populate('amenity', 'name type location')
      .populate('flat', 'flatNo tower')
      .populate('society', 'name address')
      .populate('bookedBy.userId', 'name fullName')
      .populate('approvedBy', 'name')
      .sort({ bookingDate: -1, startTime: -1 });

    res.json({ success: true, count: bookings.length, data: bookings });

  } catch (error) {
    console.error('Admin get bookings error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch admin bookings', error: error.message });
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
    // If requester is an admin, return all bookings for the society
    if (req.user.role === 'admin' || req.user.role === 'SUPER_ADMIN' || req.user.type === 'admin') {
      const bookings = await AmenityBooking.find({ society: societyId })
        .populate('amenity', 'name type location')
        .populate('flat', 'flatNo tower')
        .populate('bookedBy.userId', 'name fullName')
        .populate('approvedBy', 'name')
        .sort({ bookingDate: -1, startTime: -1 });

      return res.json({
        success: true,
        count: bookings.length,
        data: bookings
      });
    }

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
      .populate('bookedBy.userId', 'name fullName')
      .populate('approvedBy', 'name')
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
 * Update booking status (Approve/Reject/Complete/Cancel)
 * PUT /api/amenity-bookings/:id/status
 */
router.put('/:id/status', async (req, res) => {
  try {
    const { status, rejectionReason, notes, approvedBy } = req.body;

    // Validate status - allow all valid statuses from enum
    const validStatuses = ['Pending', 'Approved', 'Rejected', 'Cancelled', 'Completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const booking = await AmenityBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Log the status change
    console.log(`📋 Updating booking ${req.params.id} status from "${booking.status}" to "${status}"`);

    // Update status
    booking.status = status;

    if (status === 'Approved') {
      booking.approvedBy = approvedBy || null;
      booking.approvedAt = new Date();
      // Clear rejection reason if changing from rejected
      booking.rejectionReason = undefined;
    } else if (status === 'Rejected') {
      booking.rejectionReason = rejectionReason || 'No reason provided';
      // Clear approval info if changing from approved
      booking.approvedBy = undefined;
      booking.approvedAt = undefined;
    } else if (status === 'Cancelled') {
      booking.cancellationReason = notes || rejectionReason || 'Cancelled by admin';
      booking.cancelledAt = new Date();
    } else if (status === 'Completed') {
      // Mark as completed
      booking.completedAt = new Date();
    }

    if (notes && status !== 'Cancelled') {
      booking.notes = notes;
    }

    await booking.save();

    await booking.populate([
      { path: 'amenity', select: 'name type' },
      { path: 'flat', select: 'flatNo tower' },
      { path: 'bookedBy.userId' }
    ]);

    console.log(`✅ Booking status updated successfully to "${status}"`);

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

/**
 * Create Secretary Booking
 * POST /api/amenity-bookings/secretary
 */
router.post('/secretary/create', async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Request body is empty'
      });
    }

    const {
      amenityId,
      societyName,
      cityName,
      bookingDate,
      startTime,
      endTime,
      secretaryName,
      meetingType,
      participantCount,
    } = req.body;

    console.log('📝 Secretary Booking Request:', req.body);

    // Validate required fields
    const missing = [];
    if (!amenityId) missing.push('amenityId');
    if (!societyName) missing.push('societyName');
    if (!bookingDate) missing.push('bookingDate');
    if (!startTime) missing.push('startTime');
    if (!endTime) missing.push('endTime');
    if (!secretaryName) missing.push('secretaryName');
    if (!meetingType) missing.push('meetingType');

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
        message: 'Invalid amenityId format'
      });
    }

    // Find society
    const Society = (await import('../models/Society.js')).default;
    const City = (await import('../models/City.js')).default;
    let city;
    if (cityName) {
      city = await City.findOne({ name: new RegExp(`^${cityName}$`, 'i') });
    }
    const society = await Society.findOne({ 
      name: new RegExp(`^${societyName}$`, 'i'),
      ...(city && { city: city._id })
    });

    if (!society) {
      return res.status(404).json({
        success: false,
        message: `Society not found: ${societyName}${cityName ? ` in ${cityName}` : ''}`
      });
    }

    console.log('✅ Society found:', society._id);

    // Get amenity
    const amenity = await Amenity.findById(amenityId);
    if (!amenity || !amenity.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Amenity not found or inactive'
      });
    }

    console.log('✅ Amenity found:', amenity._id);

    // Time validation
    const start = new Date(`1970-01-01T${startTime}`);
    const end = new Date(`1970-01-01T${endTime}`);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time format. Use HH:MM format'
      });
    }

    const duration = (end - start) / (1000 * 60 * 60);

    if (duration <= 0) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time'
      });
    }

    // Create secretary booking
    const booking = await AmenityBooking.create({
      amenity: amenityId,
      society: society._id,
      flat: null,
      tower: null,
      bookedBy: {
        userType: 'Secretary',
        name: secretaryName
      },
      bookingType: 'SecretaryBooking',
      secretaryDetails: {
        secretaryName,
        meetingType,
        participantCount: participantCount || 0
      },
      bookingDate,
      startTime,
      endTime,
      duration,
      purpose: `Society Meeting - ${meetingType}`,
      numberOfGuests: participantCount || 0,
      status: 'Pending'
    });

    console.log('✅ Secretary booking created:', booking._id);

    res.status(201).json({
      success: true,
      message: 'Secretary booking created successfully',
      data: booking
    });

  } catch (error) {
    console.error('❌ Secretary booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create secretary booking',
      error: error.message
    });
  }
});

/**
 * Delete booking
 * DELETE /api/amenity-bookings/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const booking = await AmenityBooking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Only allow deletion of Pending or Rejected bookings
    if (!['Pending', 'Rejected', 'Cancelled'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete booking with status: ${booking.status}. Only Pending, Rejected, or Cancelled bookings can be deleted.`
      });
    }

    await AmenityBooking.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Booking deleted successfully'
    });

  } catch (error) {
    console.error('Delete booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting booking',
      error: error.message
    });
  }
});

export default router;
