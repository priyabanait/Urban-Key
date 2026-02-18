import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Manager from '../models/Manager.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Manager login with email/password
router.post('/login', async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    // Normalize email to avoid case/whitespace issues
    email = String(email).trim().toLowerCase();

    // Find manager by email and include password field
    const manager = await Manager.findOne({ email }).select('+password').populate({ path: 'society', select: 'name city', populate: { path: 'city', select: 'name _id' } });

    console.log('Login attempt:', { email, found: !!manager });
    
    if (!manager) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials (user not found)'
      });
    }

    // Check if manager is active
    if (manager.status !== 'active') {
      console.log('Login blocked - inactive account:', { email, status: manager.status });
      return res.status(403).json({
        success: false,
        message: 'Account is not active. Please contact administrator.'
      });
    }

    // Verify password
    const isPasswordMatch = await manager.comparePassword(password);
    
    if (!isPasswordMatch) {
      console.log('Login failed - password mismatch for', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials (wrong password)'
      });
    }

    // Update last login
    manager.lastLogin = new Date();
    await manager.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        id: manager._id,
        email: manager.email,
        role: manager.role,
        societyId: manager.society
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );

    const society = manager.society;
    const cityId = society?.city?._id || society?.city;

    res.json({
      success: true,
      token,
      user: {
        id: manager._id,
        name: manager.name,
        email: manager.email,
        role: manager.role,
        department: manager.department,
        status: manager.status,
        societyId: manager.society?._id || manager.society,
        cityId: cityId
      }
    });
  } catch (error) {
    console.error('Manager login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login error',
      error: error.message
    });
  }
});

// Get manager details by ID
router.get('/managers/:id', authenticate, async (req, res) => {
  try {
    const manager = await Manager.findById(req.params.id).select('-password');
    
    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'Manager not found'
      });
    }

    res.json({
      success: true,
      ...manager.toObject(),
      mobile: manager.mobile,
      department: manager.department,
      status: manager.status,
      createdAt: manager.createdAt
    });
  } catch (error) {
    console.error('Get manager error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching manager details',
      error: error.message
    });
  }
});

// Get current manager profile
router.get('/me', authenticate, async (req, res) => {
  try {
    const manager = await Manager.findById(req.user.id).select('-password');
    
    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'Manager not found'
      });
    }

    res.json({
      success: true,
      user: manager
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
});

export default router;

