import express from 'express';
import FamilyMember from '../models/FamilyMember.js';
import Resident from '../models/Resident.js';
import User from '../models/User.js';

const router = express.Router();

/**
 * ✅ Add a family member
 * POST /api/family-members
 */
router.post('/', async (req, res) => {
  try {
    const { 
      loginId,
      mobile,
      name,
      relation,
      age,
      gender,
      phone,
      email,
      password,
      photo,
      residentId,
      flatId
    } = req.body;

    if (!loginId && !mobile) {
      return res.status(400).json({
        success: false,
        message: 'Either loginId or mobile is required'
      });
    }

    let user;
    if (loginId) {
      user = await User.findById(loginId);
    } else {
      user = await User.findOne({ mobile });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!name || !relation) {
      return res.status(400).json({
        success: false,
        message: 'Name and relation are required'
      });
    }

    let resident;
    if (residentId) {
      resident = await Resident.findById(residentId);
    } else {
      resident = await Resident.findOne({ mobile: user.mobile });
    }

    if (!resident) {
      return res.status(404).json({
        success: false,
        message: 'Resident not found'
      });
    }

    const familyMember = await FamilyMember.create({
      resident: resident._id,
      flat: flatId || null,
      name,
      relation,
      age,
      gender,
      phone,
      email: email?.toLowerCase(),
      password,
      photo,
      isApproved: false,
      canLogin: !!(email && password)
    });

    await familyMember.populate([
      { path: 'resident', select: 'fullName mobile' },
      { path: 'flat', select: 'flatNo tower' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Family member added successfully',
      data: familyMember
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Failed to add family member',
      error: error.message
    });
  }
});

/**
 * ✅ Bulk add family members
 */
router.post('/bulk', async (req, res) => {
  try {
    const { familyMembers, residentId, flatId } = req.body;

    if (!familyMembers || !Array.isArray(familyMembers)) {
      return res.status(400).json({
        success: false,
        message: 'familyMembers array is required'
      });
    }

    const resident = await Resident.findById(residentId);
    if (!resident) {
      return res.status(404).json({
        success: false,
        message: 'Resident not found'
      });
    }

    const members = familyMembers.map(m => ({
      resident: resident._id,
      flat: flatId || null,
      name: m.name,
      relation: m.relation,
      age: m.age,
      phone: m.phone,
      photo: m.photo,
      isApproved: false
    }));

    const created = await FamilyMember.insertMany(members);

    res.status(201).json({
      success: true,
      message: `${created.length} family members added`,
      data: created
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Bulk insert failed',
      error: error.message
    });
  }
});

/**
 * ✅ Get family members by resident mobile
 */
router.get('/by-mobile/:mobile', async (req, res) => {
  try {
    const resident = await Resident.findOne({ mobile: req.params.mobile });
    if (!resident) {
      return res.status(404).json({ success: false, message: 'Resident not found' });
    }

    const familyMembers = await FamilyMember.find({ resident: resident._id })
      .populate('flat', 'flatNo tower')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: familyMembers,
      count: familyMembers.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch family members',
      error: error.message
    });
  }
});

/**
 * ✅ Get family members by resident ID
 */
router.get('/by-resident/:residentId', async (req, res) => {
  try {
    const familyMembers = await FamilyMember.find({
      resident: req.params.residentId
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: familyMembers,
      count: familyMembers.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch family members',
      error: error.message
    });
  }
});

/**
 * ✅ Get single family member
 */
router.get('/:id', async (req, res) => {
  try {
    const member = await FamilyMember.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    res.json({ success: true, data: member });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * ✅ Update family member
 */
router.put('/:id', async (req, res) => {
  try {
    const member = await FamilyMember.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!member) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    res.json({
      success: true,
      message: 'Updated successfully',
      data: member
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * ✅ Delete family member
 */
router.delete('/:id', async (req, res) => {
  try {
    const member = await FamilyMember.findByIdAndDelete(req.params.id);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
