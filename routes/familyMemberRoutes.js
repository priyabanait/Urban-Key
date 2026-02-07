import express from 'express';
import FamilyMember from '../models/FamilyMember.js';
import Resident from '../models/Resident.js';

const router = express.Router();

/* =========================================================
   ✅ ADD SINGLE FAMILY MEMBER (NO LOGIN ID)
   POST /api/family-members
========================================================= */
router.post('/', async (req, res) => {
  try {
    const {
      residentId,
      flatId,
      name,
      relation,
      age,
      gender,
      phone,
      email,
      password,
      photo
    } = req.body;

    // 🔒 Validations
    if (!residentId) {
      return res.status(400).json({
        success: false,
        message: 'residentId is required'
      });
    }

    if (!name || !relation) {
      return res.status(400).json({
        success: false,
        message: 'Name and relation are required'
      });
    }

    // 🔎 Find resident
    const resident = await Resident.findById(residentId);
    if (!resident) {
      return res.status(404).json({
        success: false,
        message: 'Resident not found'
      });
    }

    // 🧾 Create family member
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
      canLogin: Boolean(email && password)
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

/* =========================================================
   ✅ BULK ADD FAMILY MEMBERS
   POST /api/family-members/bulk
========================================================= */
router.post('/bulk', async (req, res) => {
  try {
    const { familyMembers, residentId, flatId } = req.body;

    if (!residentId) {
      return res.status(400).json({
        success: false,
        message: 'residentId is required'
      });
    }

    if (!Array.isArray(familyMembers) || familyMembers.length === 0) {
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
      gender: m.gender,
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

/* =========================================================
   ✅ GET FAMILY MEMBERS BY RESIDENT ID
   GET /api/family-members/by-resident/:residentId
========================================================= */
router.get('/by-resident/:residentId', async (req, res) => {
  try {
    const familyMembers = await FamilyMember.find({
      resident: req.params.residentId
    })
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

/* =========================================================
   ✅ GET SINGLE FAMILY MEMBER
   GET /api/family-members/:id
========================================================= */
router.get('/:id', async (req, res) => {
  try {
    const member = await FamilyMember.findById(req.params.id)
      .populate('resident', 'fullName mobile')
      .populate('flat', 'flatNo tower');

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Family member not found'
      });
    }

    res.json({
      success: true,
      data: member
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/* =========================================================
   ✅ UPDATE FAMILY MEMBER
   PUT /api/family-members/:id
========================================================= */
router.put('/:id', async (req, res) => {
  try {
    const member = await FamilyMember.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Family member not found'
      });
    }

    res.json({
      success: true,
      message: 'Updated successfully',
      data: member
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/* =========================================================
   ✅ DELETE FAMILY MEMBER
   DELETE /api/family-members/:id
========================================================= */
router.delete('/:id', async (req, res) => {
  try {
    const member = await FamilyMember.findByIdAndDelete(req.params.id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Family member not found'
      });
    }

    res.json({
      success: true,
      message: 'Deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
