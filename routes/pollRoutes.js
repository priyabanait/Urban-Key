import express from 'express';
import Poll from '../models/Poll.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validatePoll } from '../middleware/validationMiddleware.js';

const router = express.Router();

// Get all polls
router.get('/', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    
    const query = { society: req.user.societyId };
    if (status) query.status = status;
    
    const polls = await Poll.find(query)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: polls.length,
      data: polls
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching polls',
      error: error.message
    });
  }
});

// Get single poll
router.get('/:id', authenticate, async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id)
      .populate('createdBy', 'name');
    
    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    res.json({
      success: true,
      data: poll
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching poll',
      error: error.message
    });
  }
});

// Create poll
router.post('/', authenticate, validatePoll, async (req, res) => {
  try {
    const poll = await Poll.create({
      ...req.body,
      society: req.user.societyId,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Poll created successfully',
      data: poll
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating poll',
      error: error.message
    });
  }
});

// Submit poll response
router.post('/:id/vote', authenticate, async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    
    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    // Check if poll is active
    if (poll.status !== 'Active' || new Date() > poll.endDate) {
      return res.status(400).json({
        success: false,
        message: 'Poll is not active'
      });
    }

    // Check if user already voted
    const hasVoted = poll.responses.some(r => r.user.toString() === req.user.id);
    if (hasVoted) {
      return res.status(400).json({
        success: false,
        message: 'You have already voted'
      });
    }

    // Add response
    poll.responses.push({
      user: req.user.id,
      flat: req.user.flatId,
      answers: req.body.answers
    });

    // Update vote counts
    req.body.answers.forEach(answer => {
      answer.selectedOptions.forEach(optionIndex => {
        poll.questions[answer.questionIndex].options[optionIndex].votes++;
      });
    });

    await poll.save();

    res.json({
      success: true,
      message: 'Vote submitted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error submitting vote',
      error: error.message
    });
  }
});

// Close poll
router.put('/:id/close', authenticate, async (req, res) => {
  try {
    const poll = await Poll.findByIdAndUpdate(
      req.params.id,
      { status: 'Closed' },
      { new: true }
    );

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    res.json({
      success: true,
      message: 'Poll closed successfully',
      data: poll
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error closing poll',
      error: error.message
    });
  }
});

export default router;
