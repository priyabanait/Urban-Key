import express from 'express';
import FamilyMember from '../models/FamilyMember.js';
import Vehicle from '../models/vehicle.js';
import Maid from '../models/Maid.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all pending approvals
router.get('/pending', authenticate, async (req, res) => {
  try {
    const familyMembers = await FamilyMember.find({ isApproved: false })
      .populate('resident', 'name')
      .populate('flat', 'flatNo tower');
    
    const vehicles = await Vehicle.find({ isApproved: false })
      .populate('resident', 'name')
      .populate('flat', 'flatNo tower');
    
    const maids = await Maid.find({ isApproved: false })
      .populate('resident', 'name')
      .populate('flat', 'flatNo tower');

    res.json({
      success: true,
      data: {
        familyMembers,
        vehicles,
        maids,
        total: familyMembers.length + vehicles.length + maids.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching approvals',
      error: error.message
    });
  }
});

// Approve family member
router.put('/family/:id/approve', authenticate, async (req, res) => {
  try {
    const member = await FamilyMember.findByIdAndUpdate(
      req.params.id,
      { 
        isApproved: true,
        approvedBy: req.user.id,
        approvedAt: new Date()
      },
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
      message: 'Family member approved successfully',
      data: member
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error approving family member',
      error: error.message
    });
  }
});

// Approve vehicle
router.put('/vehicle/:id/approve', authenticate, async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { 
        isApproved: true,
        approvedBy: req.user.id,
        approvedAt: new Date()
      },
      { new: true }
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    res.json({
      success: true,
      message: 'Vehicle approved successfully',
      data: vehicle
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error approving vehicle',
      error: error.message
    });
  }
});

// Approve maid
router.put('/maid/:id/approve', authenticate, async (req, res) => {
  try {
    const maid = await Maid.findByIdAndUpdate(
      req.params.id,
      { 
        isApproved: true,
        approvedBy: req.user.id,
        approvedAt: new Date()
      },
      { new: true }
    );

    if (!maid) {
      return res.status(404).json({
        success: false,
        message: 'Maid not found'
      });
    }

    res.json({
      success: true,
      message: 'Maid approved successfully',
      data: maid
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error approving maid',
      error: error.message
    });
  }
});

// Reject any approval
router.delete('/:type/:id', authenticate, async (req, res) => {
  try {
    const { type, id } = req.params;
    
    let Model;
    let itemName;
    
    switch (type) {
      case 'family':
        Model = FamilyMember;
        itemName = 'Family member';
        break;
      case 'vehicle':
        Model = Vehicle;
        itemName = 'Vehicle';
        break;
      case 'maid':
        Model = Maid;
        itemName = 'Maid';
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid approval type'
        });
    }

    const item = await Model.findByIdAndDelete(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: `${itemName} not found`
      });
    }

    res.json({
      success: true,
      message: `${itemName} rejected successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error rejecting approval',
      error: error.message
    });
  }
});

export default router;
