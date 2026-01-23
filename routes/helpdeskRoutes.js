import express from 'express';
import Helpdesk from '../models/Helpdesk.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateHelpdesk } from '../middleware/validationMiddleware.js';

const router = express.Router();

// Get all tickets
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, category, priority } = req.query;
    
    const query = { society: req.user.societyId };
    
    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    
    const tickets = await Helpdesk.find(query)
      .populate('resident', 'name')
      .populate('flat', 'flatNo tower')
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: tickets.length,
      data: tickets
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching tickets',
      error: error.message
    });
  }
});

// Get single ticket
router.get('/:id', authenticate, async (req, res) => {
  try {
    const ticket = await Helpdesk.findById(req.params.id)
      .populate('resident', 'name email phone')
      .populate('flat', 'flatNo tower')
      .populate('assignedTo', 'name')
      .populate('comments.user', 'name');
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    res.json({
      success: true,
      data: ticket
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ticket',
      error: error.message
    });
  }
});

// Create ticket
router.post('/', authenticate, validateHelpdesk, async (req, res) => {
  try {
    const ticket = await Helpdesk.create({
      ...req.body,
      society: req.user.societyId,
      resident: req.user.residentId,
      flat: req.user.flatId
    });

    res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      data: ticket
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating ticket',
      error: error.message
    });
  }
});

// Update ticket status
router.put('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    
    const updateData = { status };
    if (status === 'Resolved') updateData.resolvedAt = new Date();
    if (status === 'Closed') updateData.closedAt = new Date();
    
    const ticket = await Helpdesk.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    res.json({
      success: true,
      message: 'Ticket status updated successfully',
      data: ticket
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating ticket',
      error: error.message
    });
  }
});

// Assign ticket
router.put('/:id/assign', authenticate, async (req, res) => {
  try {
    const ticket = await Helpdesk.findByIdAndUpdate(
      req.params.id,
      { assignedTo: req.body.assignedTo, status: 'In Progress' },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    res.json({
      success: true,
      message: 'Ticket assigned successfully',
      data: ticket
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error assigning ticket',
      error: error.message
    });
  }
});

// Add comment
router.post('/:id/comment', authenticate, async (req, res) => {
  try {
    const ticket = await Helpdesk.findById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    ticket.comments.push({
      user: req.user.id,
      comment: req.body.comment
    });

    await ticket.save();

    res.json({
      success: true,
      message: 'Comment added successfully',
      data: ticket
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding comment',
      error: error.message
    });
  }
});

export default router;
