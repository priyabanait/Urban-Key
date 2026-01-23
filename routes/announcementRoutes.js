import express from 'express';
import Announcement from '../models/Announcement.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateAnnouncement } from '../middleware/validationMiddleware.js';

const router = express.Router();

// Get all announcements
router.get('/', authenticate, async (req, res) => {
  try {
    const { category, priority } = req.query;
    
    const query = { 
      society: req.user.societyId, 
      isActive: true,
      $or: [
        { expiryDate: null },
        { expiryDate: { $gte: new Date() } }
      ]
    };
    
    if (category) query.category = category;
    if (priority) query.priority = priority;
    
    const announcements = await Announcement.find(query)
      .populate('createdBy', 'name')
      .sort({ isPinned: -1, createdAt: -1 });
    
    res.json({
      success: true,
      count: announcements.length,
      data: announcements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching announcements',
      error: error.message
    });
  }
});

// Get single announcement
router.get('/:id', authenticate, async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate('createdBy', 'name');
    
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    res.json({
      success: true,
      data: announcement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching announcement',
      error: error.message
    });
  }
});

// Create announcement
router.post('/', authenticate, validateAnnouncement, async (req, res) => {
  try {
    const announcement = await Announcement.create({
      ...req.body,
      society: req.user.societyId,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      data: announcement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating announcement',
      error: error.message
    });
  }
});

// Update announcement
router.put('/:id', authenticate, async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    res.json({
      success: true,
      message: 'Announcement updated successfully',
      data: announcement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating announcement',
      error: error.message
    });
  }
});

// Delete announcement
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    res.json({
      success: true,
      message: 'Announcement deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting announcement',
      error: error.message
    });
  }
});

export default router;
