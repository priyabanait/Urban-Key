import express from 'express';
import Announcement from '../models/Announcement.js';
import Society from '../models/Society.js';
import { validateAnnouncement } from '../middleware/validationMiddleware.js';

const router = express.Router();

// Get all announcements
router.get('/', async (req, res) => {
  try {
    const { category, priority, society, cityId } = req.query;

    // Get start of today for date comparison
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Get end of today (for comparing dates, not exact times)
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const query = {
      isActive: true,
      $or: [
        { expiryDate: null },
        { expiryDate: { $gte: tomorrowStart } }  // Compare with tomorrow's start
      ]
    };

    if (society) {
      query.society = society;
    } else if (cityId) {
      // Filter by all societies in this city
      const societies = await Society.find({ city: cityId, isActive: { $ne: false } }).select('_id').lean();
      const societyIds = societies.map((s) => s._id);
      if (societyIds.length) query.society = { $in: societyIds };
    }
    if (category) query.category = category;
    if (priority) query.priority = priority;

    const announcements = await Announcement.find(query)
      .populate('society', 'name')   // ✅ get society name
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
router.get('/:id', async (req, res) => {
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
router.post('/', validateAnnouncement, async (req, res) => {
  try {
    const announcement = await Announcement.create({
      ...req.body
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
router.put('/:id', async (req, res) => {
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
router.delete('/:id', async (req, res) => {
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
