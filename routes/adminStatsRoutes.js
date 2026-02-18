import express from 'express';
import Resident from '../models/Resident.js';
import Tower from '../models/Tower.js';
import Flat from '../models/Flat.js';
import Society from '../models/Society.js';
import City from '../models/City.js';

const router = express.Router();

/**
 * GET /api/admin/stats
 * Query: cityId, societyId
 * - If societyId: stats for that society only
 * - If cityId only: aggregated stats for all societies in that city
 * - If neither: return empty stats
 */
router.get('/', async (req, res) => {
  try {
    const { cityId, societyId } = req.query;

    const stats = {
      residents: 0,
      towers: 0,
      flats: 0,
      pendingApprovals: 0,
      openTickets: 0,
      activeAmenities: 0,
      polls: 0,
      visitorsToday: 0,
      security: 0,
      recentActivities: [],
    };

    if (!cityId && !societyId) {
      return res.json({ success: true, data: stats });
    }

    let societyIds = [];
    let cityName = null;

    if (societyId) {
      const soc = await Society.findById(societyId);
      if (!soc) return res.json({ success: true, data: stats });
      societyIds = [societyId];
      const city = await City.findById(soc.city);
      cityName = city?.name;
    } else if (cityId) {
      const societies = await Society.find({ city: cityId, isActive: { $ne: false } }).select('_id name');
      societyIds = societies.map((s) => s._id);
      const city = await City.findById(cityId);
      cityName = city?.name;
    }

    if (societyIds.length === 0) {
      return res.json({ success: true, data: stats });
    }

    const societyNames = (await Society.find({ _id: { $in: societyIds } }).select('name').lean()).map((s) => s.name);

    // Residents (stored as city name + society name)
    const residentQuery = societyNames.length
      ? { society: { $in: societyNames } }
      : {};
    if (cityName) residentQuery.city = cityName;
    stats.residents = await Resident.countDocuments(residentQuery);

    // Towers (by society ObjectId)
    stats.towers = await Tower.countDocuments({ society: { $in: societyIds }, isActive: true });

    // Flats (by society ObjectId)
    stats.flats = await Flat.countDocuments({ society: { $in: societyIds }, isActive: true });

    // Helpdesk open tickets
    const Helpdesk = (await import('../models/Helpdesk.js')).default;
    stats.openTickets = await Helpdesk.countDocuments({
      society: { $in: societyIds },
      status: { $in: ['Open', 'In Progress'] },
    });

    // Active amenities
    const Amenity = (await import('../models/Amenity.js')).default;
    stats.activeAmenities = await Amenity.countDocuments({
      $or: [{ society: { $in: societyIds } }, { societyId: { $in: societyIds.map(String) } }],
      isActive: true,
    });

    // Polls
    const Poll = (await import('../models/Poll.js')).default;
    stats.polls = await Poll.countDocuments({ society: { $in: societyIds } });

    // Visitors today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const Visitor = (await import('../models/Visitor.js')).default;
    stats.visitorsToday = await Visitor.countDocuments({
      society: { $in: societyIds },
      checkInTime: { $gte: today },
    });

    // Pending approvals - FamilyMember, Maid (flat), Vehicle (residentId -> resident in society)
    const FamilyMember = (await import('../models/FamilyMember.js')).default;
    const Vehicle = (await import('../models/Vehicle.js')).default;
    const Maid = (await import('../models/Maid.js')).default;
    const flatIdsInSocieties = await Flat.find({ society: { $in: societyIds } }).select('_id').lean();
    const flatIds = flatIdsInSocieties.map((f) => f._id);
    const residentIdsInSocieties = (await Resident.find(residentQuery).select('_id').lean()).map((r) => r._id);

    const [pendingFamily, pendingVehicles, pendingMaids] = await Promise.all([
      FamilyMember.countDocuments({ isApproved: false, flat: { $in: flatIds } }),
      Vehicle.countDocuments({ isApproved: false, residentId: { $in: residentIdsInSocieties } }),
      Maid.countDocuments({ isApproved: false, flat: { $in: flatIds } }),
    ]);

    stats.pendingApprovals = pendingFamily + pendingVehicles + pendingMaids;

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('ADMIN STATS ERROR:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch admin stats',
    });
  }
});

export default router;
