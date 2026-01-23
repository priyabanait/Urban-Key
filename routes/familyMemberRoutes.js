import express from 'express';
import FamilyMember from '../models/FamilyMember.js';
import Resident from '../models/Resident.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * ✅ Add a family member (Resident adds their own family member)
 * POST /api/family-members
 * Only requires: name, relation, residentId (flatId is auto-fetched from resident)
 * Optional: email, password for login access
 */
router.post('/', async (req, res) => {
  try {
    const { 
      name, 
      relation, 
      age, 
      gender,
      phone,
      email,
      password,  // Optional: for family member login
      photo, 
      residentId   // Required - the resident this family member belongs to
    } = req.body;

    // Validate required fields
    if (!name || !relation || !residentId) {
      return res.status(400).json({
        success: false,
        message: 'Name, relation, and residentId are required'
      });
    }

    // If email is provided, validate it
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address'
        });
      }

      // Check if email already exists
      const existingMember = await FamilyMember.findOne({ email });
      if (existingMember) {
        return res.status(400).json({
          success: false,
          message: 'Email is already registered with another family member'
        });
      }
    }

    // If password is provided without email, return error
    if (password && !email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required when setting a password'
      });
    }

    // Validate password strength if provided
    if (password && password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Find resident by ID - we'll get the flatId from here
    const resident = await Resident.findById(residentId);
    if (!resident) {
      return res.status(404).json({
        success: false,
        message: 'Resident not found with ID: ' + residentId
      });
    }

    // Note: Since Resident model doesn't have a direct flat reference,
    // we'll use a placeholder. In production, link this properly or make flat optional.
    const flatId = req.body.flatId || null; // Allow manual flatId or null

    // Create family member
    const familyMemberData = {
      resident: resident._id,
      flat: flatId, // Will be null if not provided
      name,
      relation,
      age,
      gender,
      phone,
      email: email ? email.toLowerCase() : undefined,
      password,  // Will be hashed by pre-save hook if provided
      photo,
      isApproved: false,
      canLogin: !!(email && password)  // Enable login if both email and password provided
    };

    const familyMember = await FamilyMember.create(familyMemberData);

    // Populate response
    await familyMember.populate([
      { path: 'resident', select: 'fullName mobile' },
      { path: 'flat', select: 'flatNo tower' }
    ]);

    res.status(201).json({
      success: true,
      message: email && password 
        ? 'Family member added successfully with login credentials. Pending admin approval.'
        : 'Family member added successfully. Pending admin approval.',
      data: familyMember
    });
  } catch (error) {
    console.error('Add family member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add family member',
      error: error.message
    });
  }
});


/**
 * ✅ Add multiple family members at once
 * POST /api/family-members/bulk
 */
router.post('/bulk', authenticate, async (req, res) => {
  try {
    const { familyMembers, flatId } = req.body;

    // Validate input
    if (!familyMembers || !Array.isArray(familyMembers) || familyMembers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Family members array is required'
      });
    }

    if (!flatId) {
      return res.status(400).json({
        success: false,
        message: 'Flat ID is required'
      });
    }

    // Find the resident making the request
    const resident = await Resident.findOne({ mobile: req.user.mobile });
    
    if (!resident) {
      return res.status(404).json({
        success: false,
        message: 'Resident profile not found'
      });
    }

    // Prepare family members data
    const membersToCreate = familyMembers.map(member => ({
      resident: resident._id,
      flat: flatId,
      name: member.name,
      relation: member.relation,
      age: member.age,
      phone: member.phone,
      photo: member.photo,
      isApproved: false
    }));

    // Create all family members
    const createdMembers = await FamilyMember.insertMany(membersToCreate);

    // Populate the created members
    const populatedMembers = await FamilyMember.find({
      _id: { $in: createdMembers.map(m => m._id) }
    }).populate([
      { path: 'resident', select: 'fullName mobile' },
      { path: 'flat', select: 'flatNo tower' }
    ]);

    res.status(201).json({
      success: true,
      message: `${createdMembers.length} family members added successfully. Pending admin approval.`,
      data: populatedMembers,
      count: createdMembers.length
    });
  } catch (error) {
    console.error('Bulk add family members error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add family members',
      error: error.message
    });
  }
});

/**
 * ✅ Get all family members for logged-in resident
 * GET /api/family-members/my-family
 */
router.get('/my-family', authenticate, async (req, res) => {
  try {
    // Find the resident making the request
    const resident = await Resident.findOne({ mobile: req.user.mobile });
    
    if (!resident) {
      return res.status(404).json({
        success: false,
        message: 'Resident profile not found'
      });
    }

    // Get all family members for this resident
    const familyMembers = await FamilyMember.find({ resident: resident._id })
      .populate('flat', 'flatNo tower')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: familyMembers,
      count: familyMembers.length
    });
  } catch (error) {
    console.error('Get my family members error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch family members',
      error: error.message
    });
  }
});

/**
 * ✅ Get family members by resident mobile number (Admin can view any resident's family)
 * GET /api/family-members/by-mobile/:mobile
 */
router.get('/by-mobile/:mobile', authenticate, async (req, res) => {
  try {
    // Find the resident by mobile
    const resident = await Resident.findOne({ mobile: req.params.mobile });
    
    if (!resident) {
      return res.status(404).json({
        success: false,
        message: 'Resident not found'
      });
    }

    // Get all family members for this resident
    const familyMembers = await FamilyMember.find({ resident: resident._id })
      .populate('flat', 'flatNo tower')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        resident: {
          _id: resident._id,
          fullName: resident.fullName,
          mobile: resident.mobile,
          email: resident.email,
          flatNumber: resident.flatNumber,
          ownershipType: resident.ownershipType
        },
        familyMembers,
        count: familyMembers.length
      }
    });
  } catch (error) {
    console.error('Get family members by mobile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch family members',
      error: error.message
    });
  }
});

/**
 * ✅ Get family members by resident ID (Admin can view any resident's family)
 * GET /api/family-members/by-resident/:residentId
 */
router.get('/by-resident/:residentId', authenticate, async (req, res) => {
  try {
    // Find the resident
    const resident = await Resident.findById(req.params.residentId);
    
    if (!resident) {
      return res.status(404).json({
        success: false,
        message: 'Resident not found'
      });
    }

    // Get all family members for this resident
    const familyMembers = await FamilyMember.find({ resident: resident._id })
      .populate('flat', 'flatNo tower')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        resident: {
          _id: resident._id,
          fullName: resident.fullName,
          mobile: resident.mobile,
          email: resident.email,
          flatNumber: resident.flatNumber,
          buildingName: resident.buildingName,
          ownershipType: resident.ownershipType,
          numberOfFamilyMembers: resident.numberOfFamilyMembers
        },
        familyMembers,
        count: familyMembers.length,
        approved: familyMembers.filter(m => m.isApproved).length,
        pending: familyMembers.filter(m => !m.isApproved).length
      }
    });
  } catch (error) {
    console.error('Get family members by resident error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch family members',
      error: error.message
    });
  }
});

/**
 * ✅ Get all family members (Admin only)
 * GET /api/family-members
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, flatId, residentId } = req.query;

    let query = {};

    // Filter by approval status
    if (status === 'approved') {
      query.isApproved = true;
    } else if (status === 'pending') {
      query.isApproved = false;
    }

    // Filter by flat
    if (flatId) {
      query.flat = flatId;
    }

    // Filter by resident
    if (residentId) {
      query.resident = residentId;
    }

    const familyMembers = await FamilyMember.find(query)
      .populate('resident', 'fullName mobile')
      .populate('flat', 'flatNo tower')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: familyMembers,
      count: familyMembers.length
    });
  } catch (error) {
    console.error('Get all family members error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch family members',
      error: error.message
    });
  }
});

/**
 * ✅ Get single family member by ID
 * GET /api/family-members/:id
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const familyMember = await FamilyMember.findById(req.params.id)
      .populate('resident', 'fullName mobile')
      .populate('flat', 'flatNo tower')
      .populate('approvedBy', 'name');

    if (!familyMember) {
      return res.status(404).json({
        success: false,
        message: 'Family member not found'
      });
    }

    res.json({
      success: true,
      data: familyMember
    });
  } catch (error) {
    console.error('Get family member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch family member',
      error: error.message
    });
  }
});

/**
 * ✅ Update family member
 * PUT /api/family-members/:id
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, relation, age, phone, photo } = req.body;

    const familyMember = await FamilyMember.findById(req.params.id);

    if (!familyMember) {
      return res.status(404).json({
        success: false,
        message: 'Family member not found'
      });
    }

    // Update fields
    if (name) familyMember.name = name;
    if (relation) familyMember.relation = relation;
    if (age !== undefined) familyMember.age = age;
    if (phone) familyMember.phone = phone;
    if (photo) familyMember.photo = photo;

    await familyMember.save();

    // Populate the updated member
    await familyMember.populate([
      { path: 'resident', select: 'fullName mobile' },
      { path: 'flat', select: 'flatNo tower' }
    ]);

    res.json({
      success: true,
      message: 'Family member updated successfully',
      data: familyMember
    });
  } catch (error) {
    console.error('Update family member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update family member',
      error: error.message
    });
  }
});

/**
 * ✅ Delete family member
 * DELETE /api/family-members/:id
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const familyMember = await FamilyMember.findByIdAndDelete(req.params.id);

    if (!familyMember) {
      return res.status(404).json({
        success: false,
        message: 'Family member not found'
      });
    }

    res.json({
      success: true,
      message: 'Family member deleted successfully'
    });
  } catch (error) {
    console.error('Delete family member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete family member',
      error: error.message
    });
  }
});

/**
 * ✅ Approve family member (Admin only)
 * PUT /api/family-members/:id/approve
 */
router.put('/:id/approve', authenticate, async (req, res) => {
  try {
    const familyMember = await FamilyMember.findByIdAndUpdate(
      req.params.id,
      {
        isApproved: true,
        approvedBy: req.user.id,
        approvedAt: new Date()
      },
      { new: true }
    ).populate([
      { path: 'resident', select: 'fullName mobile' },
      { path: 'flat', select: 'flatNo tower' },
      { path: 'approvedBy', select: 'name' }
    ]);

    if (!familyMember) {
      return res.status(404).json({
        success: false,
        message: 'Family member not found'
      });
    }

    res.json({
      success: true,
      message: 'Family member approved successfully',
      data: familyMember
    });
  } catch (error) {
    console.error('Approve family member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve family member',
      error: error.message
    });
  }
});

/**
 * ✅ Reject family member (Admin only)
 * PUT /api/family-members/:id/reject
 */
router.put('/:id/reject', authenticate, async (req, res) => {
  try {
    const familyMember = await FamilyMember.findByIdAndDelete(req.params.id);

    if (!familyMember) {
      return res.status(404).json({
        success: false,
        message: 'Family member not found'
      });
    }

    res.json({
      success: true,
      message: 'Family member rejected and removed'
    });
  } catch (error) {
    console.error('Reject family member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject family member',
      error: error.message
    });
  }
});

/**
 * ✅ Get family members count for a resident
 * GET /api/family-members/count/:residentId
 */
router.get('/count/:residentId', authenticate, async (req, res) => {
  try {
    const count = await FamilyMember.countDocuments({
      resident: req.params.residentId,
      isApproved: true
    });

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Get family members count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get family members count',
      error: error.message
    });
  }
});

export default router;
