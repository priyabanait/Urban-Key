import express from 'express';
import Resident from '../models/Resident.js';
import User from '../models/User.js';
import FamilyMember from '../models/FamilyMember.js';

const router = express.Router();

/**
 * ✅ Create New Member (Admin / Pre-added member)
 * isNewMember = true → registration form will be shown
 */
router.post('/', async (req, res) => {
  try {
    const member = await Resident.create({
      ...req.body,
      isNewMember: true,
      registrationCompleted: false
    });

    res.status(201).json({
      success: true,
      message: 'Member added successfully',
      member
    });
  } catch (error) {
    console.error('Create member error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create member',
      error: error.message 
    });
  }
});

/**
 * ✅ Get Member By Mobile (Login / Check status)
 */
router.get('/by-mobile/:mobile', async (req, res) => {
  try {
    const member = await Resident.findOne({
      mobile: req.params.mobile
    });

    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    res.json(member);
  } catch (error) {
    console.error('Get member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * ✅ Complete Registration Form (Member submits form)
 * Now includes support for adding family members during registration
 */
router.post('/complete-registration/:id', async (req, res) => {
  try {
    const member = await Resident.findById(req.params.id);

    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    // Extract family members if provided
    const { familyMembers, ...registrationData } = req.body;

    // Update resident data
    Object.assign(member, registrationData, {
      isNewMember: false,
      registrationCompleted: true
    });

    await member.save();

    res.json({
      message: 'Registration completed successfully',
      member,
      familyMembersNote: familyMembers ? 
        'Family members should be added via /api/family-members endpoint' : 
        undefined
    });
  } catch (error) {
    console.error('Complete registration error:', error);
    res.status(500).json({ message: 'Failed to complete registration' });
  }
});

/**
 * ✅ Get All Members (Admin)
 */
router.get('/', async (req, res) => {
  try {
    const members = await Resident.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: members.length,
      data: members
    });
  } catch (error) {
    console.error('Get members error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch members',
      error: error.message 
    });
  }
});

/**
 * ✅ Get Member with Family Details By ID
 * IMPORTANT: This route must come BEFORE /:id to avoid conflicts
 */
router.get('/:id/with-family', async (req, res) => {
  try {
    const member = await Resident.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ 
        success: false,
        message: 'Member not found' 
      });
    }

    // Get family members for this resident
    const familyMembers = await FamilyMember.find({ resident: member._id })
      .populate('flat', 'flatNo tower')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        resident: member,
        familyMembers,
        familyCount: {
          total: familyMembers.length,
          approved: familyMembers.filter(fm => fm.isApproved).length,
          pending: familyMembers.filter(fm => !fm.isApproved).length
        }
      }
    });
  } catch (error) {
    console.error('Get member with family error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

/**
 * ✅ Get Single Member By ID
 */
router.get('/:id', async (req, res) => {
  try {
    const member = await Resident.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }
    res.json(member);
  } catch (error) {
    console.error('Get member by id error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * ✅ Admin Approval - Updates both Resident and User status
 */
router.put('/:id/approve', async (req, res) => {
  try {
    // Find the user by ID (the ID passed is the User ID)
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find and update the resident profile
    const resident = await Resident.findOneAndUpdate(
      { mobile: user.mobile },
      {
        approvedByAdmin: true,
        approvedAt: new Date(),
        approvedBy: req.body.approvedBy || 'Admin'
      },
      { new: true }
    );

    if (!resident) {
      return res.status(404).json({ message: 'Resident profile not found' });
    }

    // Update user status to active
    user.status = 'active';
    await user.save();

    res.json({
      success: true,
      message: 'Member approved successfully',
      data: {
        status: 'Active',
        approvedByAdmin: true
      }
    });
  } catch (error) {
    console.error('Approve member error:', error);
    res.status(500).json({ message: 'Failed to approve member' });
  }
});

/**
 * ✅ Update Member (Admin / Member)
 * Handles status updates for User model
 */
router.put('/:id', async (req, res) => {
  try {
    // If updating status, update the User model
    if (req.body.status) {
      const statusLower = req.body.status.toLowerCase();
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { status: statusLower },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Also update Resident approval status if changing to active
      if (statusLower === 'active') {
        await Resident.findOneAndUpdate(
          { mobile: user.mobile },
          { 
            approvedByAdmin: true,
            approvedAt: new Date(),
            approvedBy: req.body.approvedBy || 'Admin'
          }
        );
      }

      return res.json({
        success: true,
        message: 'Status updated successfully',
        status: req.body.status
      });
    }

    // Otherwise update Resident data
    const member = await Resident.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    res.json({
      message: 'Member updated successfully',
      member
    });
  } catch (error) {
    console.error('Update member error:', error);
    res.status(500).json({ message: 'Failed to update member' });
  }
});

/**
 * ✅ Delete Member (Admin)
 */
router.delete('/:id', async (req, res) => {
  try {
    const member = await Resident.findByIdAndDelete(req.params.id);

    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    res.json({ message: 'Member deleted successfully' });
  } catch (error) {
    console.error('Delete member error:', error);
    res.status(500).json({ message: 'Failed to delete member' });
  }
});

export default router;
