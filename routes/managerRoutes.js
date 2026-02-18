import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Manager from '../models/Manager.js';
import Society from '../models/Society.js';

const router = express.Router();

// Verify JWT and attach user (for protected routes)
const authenticateJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const mockSuperAdmin = req.headers['x-mock-superadmin'];
    if (mockSuperAdmin === 'admin@urbankey.com' && process.env.NODE_ENV !== 'production') {
      req.user = { id: 'mock', email: 'admin@urbankey.com', role: 'super_admin', societyId: null };
      return next();
    }
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authorization token required' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role, societyId: decoded.societyId };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

const requireSuperAdmin = (req, res, next) => {
  if (req.user?.role !== 'super_admin') {
    return res.status(403).json({ success: false, message: 'Super admin access required' });
  }
  next();
};

/**
 * PUT /api/managers/:id - Update society admin
 */
router.put('/:id', authenticateJWT, requireSuperAdmin, async (req, res) => {
  try {
    const { name, email, password, societyId, status } = req.body;

    const manager = await Manager.findById(req.params.id);
    if (!manager) {
      return res.status(404).json({ success: false, message: 'Manager not found' });
    }

    if (name) manager.name = name.trim();
    if (email) manager.email = email.toLowerCase().trim();
    if (societyId) manager.society = societyId;
    if (status) manager.status = status;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      manager.password = await bcrypt.hash(password, salt);
    }

    await manager.save();

    const result = manager.toObject();
    delete result.password;

    res.json({
      success: true,
      message: 'Society admin updated successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


/**
 * DELETE /api/managers/:id - Delete society admin
 */
router.delete('/:id', authenticateJWT, requireSuperAdmin, async (req, res) => {
  try {
    const manager = await Manager.findById(req.params.id);
    if (!manager) {
      return res.status(404).json({ success: false, message: 'Manager not found' });
    }

    await manager.deleteOne();

    res.json({
      success: true,
      message: 'Society admin deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


/**
 * POST /api/managers - Create society admin (super_admin only)
 * Body: { name, email, password, societyId }
 */
router.post('/', authenticateJWT, requireSuperAdmin, async (req, res) => {
  try {
    const { name, email, password, societyId } = req.body;

    if (!name || !email || !password || !societyId) {
      return res.status(400).json({
        success: false,
        message: 'name, email, password and societyId are required'
      });
    }

    const society = await Society.findById(societyId);
    if (!society) {
      return res.status(400).json({ success: false, message: 'Invalid society' });
    }

    const existing = await Manager.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const manager = await Manager.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'society_admin',
      society: societyId,
      status: 'active'
    });

    const result = manager.toObject();
    delete result.password;

    res.status(201).json({
      success: true,
      message: 'Society admin created successfully',
      data: { ...result, societyId }
    });
  } catch (error) {
    console.error('Create society admin error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create society admin'
    });
  }
});

/**
 * GET /api/managers/:id - Get manager by ID (used by frontend after login)
 */
router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    const manager = await Manager.findById(req.params.id).select('-password')
      .populate({ path: 'society', select: 'name city', populate: { path: 'city', select: 'name' } });
    if (!manager) {
      return res.status(404).json({ success: false, message: 'Manager not found' });
    }
    const m = manager.toObject();
    res.json({
      ...m,
      societyId: m.society?._id || m.society,
      societyName: m.society?.name,
      cityId: m.society?.city?._id || m.society?.city,
      cityName: m.society?.city?.name
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/managers - List managers
 * super_admin: all managers
 * society_admin: only self
 */
router.get('/', authenticateJWT, async (req, res) => {
  try {
    let managers;
    const populateOpt = { path: 'society', select: 'name city', populate: { path: 'city', select: 'name' } };
    if (req.user.role === 'super_admin') {
      managers = await Manager.find({}).select('-password').populate(populateOpt).sort({ createdAt: -1 }).lean();
    } else {
      managers = await Manager.find({ _id: req.user.id }).select('-password').populate(populateOpt).lean();
    }

    const list = managers.map((m) => ({
      ...m,
      societyId: m.society?._id || m.society,
      societyName: m.society?.name,
      cityId: m.society?.city?._id || m.society?.city,
      cityName: m.society?.city?.name
    }));

    res.json({ success: true, data: list });
  } catch (error) {
    console.error('List managers error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch managers'
    });
  }
});

export default router;
