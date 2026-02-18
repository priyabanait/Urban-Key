import express from 'express';
import Visitor from '../models/Visitor.js';
import Notification from '../models/Notification.js';

const router = express.Router();

/* ================= CREATE VISITOR (CHECK-IN) ================= */
router.post('/', async (req, res) => {
  try {
    const {
      society,
      flat,
      resident, // optional
      visitorName,
      visitorPhone,
      visitorType,
      vehicleNumber,
      numberOfPeople,
      photo,
      securityGuard
    } = req.body;

    /* -------- REQUIRED FIELD CHECK -------- */
    if (!society || !flat || !visitorName || !visitorPhone) {
      return res.status(400).json({
        success: false,
        message: 'society, flat, visitorName and visitorPhone are required'
      });
    }

    if (!visitorType) {
      return res.status(400).json({
        success: false,
        message:
          'visitorType is required (Guest, Delivery, Service Provider, Cab, Other)'
      });
    }

    /* -------- CREATE VISITOR -------- */
    const visitor = await Visitor.create({
      society,
      flat,
      resident: resident || undefined, // optional safe
      visitorName: visitorName.trim(),
      visitorPhone: visitorPhone.trim(),
      visitorType,
      vehicleNumber: vehicleNumber
        ? vehicleNumber.toUpperCase().trim()
        : undefined,
      numberOfPeople: numberOfPeople || 1,
      photo,
      securityGuard,
      checkInTime: new Date(),
      status: 'Waiting'
    });

    /* -------- POPULATE REFERENCES -------- */
    await visitor.populate([
      { path: 'society', select: 'name' },
      { path: 'flat', select: 'flatNo tower' },
      { path: 'resident', select: 'fullName mobile' }, // optional populate
      { path: 'securityGuard', select: 'fullName' }
    ]);

    /* -------- NOTIFICATION ONLY IF RESIDENT EXISTS -------- */
    try {
      if (visitor.resident) {
        const title = 'Visitor Arrived';
        const message = `${visitor.visitorName} has arrived for ${
          visitor.resident?.fullName || 'your flat'
        }`;

        await Notification.create({
          type: 'new_visitor',
          title,
          message,
          payload: {
            visitorId: visitor._id,
            residentId: visitor.resident?._id
          },
          society: visitor.society?._id || visitor.society,
          read: false
        });

        const io = req.app?.locals?.io;
        const residentId = visitor.resident?._id;

        if (io && residentId) {
          io.to(`resident-${residentId}`).emit('user_notification', {
            type: 'new_visitor',
            title,
            message,
            data: { visitor }
          });
        }
      }
    } catch (err) {
      console.error('Notification error:', err);
    }

    /* -------- RESPONSE -------- */
    return res.status(201).json({
      success: true,
      message: 'Visitor checked in successfully',
      data: visitor
    });

  } catch (error) {
    console.error('CREATE VISITOR ERROR:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create visitor'
    });
  }
});


/* ================= GET ALL VISITORS ================= */
router.get('/', async (req, res) => {
  try {
    const { status, society } = req.query;

    let query = {};
    if (status) query.status = status;
    if (society) query.society = society;

    const visitors = await Visitor.find(query)
      .populate('society', 'name')
      .populate('flat', 'flatNo tower')
      .populate('resident', 'fullName mobile')
      .populate('securityGuard', 'fullName')
      .sort({ checkInTime: -1 });

    return res.status(200).json({
      success: true,
      count: visitors.length,
      data: visitors
    });
  } catch (error) {
    console.error('GET VISITORS ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch visitors'
    });
  }
});

/* ================= GET VISITORS BY SOCIETY ================= */
router.get('/by-society/:societyId', async (req, res) => {
  try {
    const { societyId } = req.params;
    const { status } = req.query;

    let query = { society: societyId };
    if (status) query.status = status;

    const visitors = await Visitor.find(query)
      .populate('flat', 'flatNo tower')
      .populate('resident', 'fullName mobile')
      .populate('securityGuard', 'fullName')
      .sort({ checkInTime: -1 });

    return res.status(200).json({
      success: true,
      count: visitors.length,
      data: visitors
    });
  } catch (error) {
    console.error('GET SOCIETY VISITORS ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch society visitors'
    });
  }
});

/* ================= GET VISITORS BY RESIDENT ================= */
router.get('/by-resident/:residentId', async (req, res) => {
  try {
    const { residentId } = req.params;
    const { status } = req.query;

    let query = { resident: residentId };
    if (status) query.status = status;

    const visitors = await Visitor.find(query)
      .populate('society', 'name')
      .populate('flat', 'flatNo tower')
      .populate('securityGuard', 'fullName')
      .sort({ checkInTime: -1 });

    return res.status(200).json({
      success: true,
      count: visitors.length,
      data: visitors
    });
  } catch (error) {
    console.error('GET RESIDENT VISITORS ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch resident visitors'
    });
  }
});

/* ================= GET VISITORS BY FLAT ================= */
router.get('/by-flat/:flatId', async (req, res) => {
  try {
    const { flatId } = req.params;
    const { status } = req.query;

    let query = { flat: flatId };
    if (status) query.status = status;

    const visitors = await Visitor.find(query)
      .populate('resident', 'fullName mobile')
      .populate('society', 'name')
      .populate('securityGuard', 'fullName')
      .sort({ checkInTime: -1 });

    return res.status(200).json({
      success: true,
      count: visitors.length,
      data: visitors
    });
  } catch (error) {
    console.error('GET FLAT VISITORS ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch flat visitors'
    });
  }
});

/* ================= GET SINGLE VISITOR ================= */
router.get('/:id', async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id)
      .populate('society', 'name')
      .populate('flat', 'flatNo tower')
      .populate('resident', 'fullName mobile')
      .populate('securityGuard', 'fullName');

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: 'Visitor not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: visitor
    });
  } catch (error) {
    console.error('GET VISITOR ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch visitor'
    });
  }
});

/* ================= UPDATE VISITOR STATUS ================= */
router.put('/:id/status', async (req, res) => {
  try {
    const { status, securityGuard } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'status is required (Waiting, Approved, Checked In, Checked Out, Rejected)'
      });
    }

    const validStatuses = ['Waiting', 'Approved', 'Checked In', 'Checked Out', 'Rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const updateData = { status };
    if (securityGuard) updateData.securityGuard = securityGuard;

    // If status is Checked Out, set checkout time
    if (status === 'Checked Out') {
      updateData.checkOutTime = new Date();
    }

    const visitor = await Visitor.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('society', 'name')
      .populate('flat', 'flatNo tower')
      .populate('resident', 'fullName mobile')
      .populate('securityGuard', 'fullName');

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: 'Visitor not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Visitor status updated successfully',
      data: visitor
    });
  } catch (error) {
    console.error('UPDATE VISITOR STATUS ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update visitor status'
    });
  }
});

/* ================= APPROVE VISITOR ================= */
router.put('/:id/approve', async (req, res) => {
  try {
    const { securityGuard } = req.body;

    const visitor = await Visitor.findByIdAndUpdate(
      req.params.id,
      {
        status: 'Approved',
        securityGuard: securityGuard || undefined
      },
      { new: true, runValidators: true }
    )
      .populate('society', 'name')
      .populate('flat', 'flatNo tower')
      .populate('resident', 'fullName mobile')
      .populate('securityGuard', 'fullName');

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: 'Visitor not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Visitor approved successfully',
      data: visitor
    });
  } catch (error) {
    console.error('APPROVE VISITOR ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to approve visitor'
    });
  }
});

/* ================= REJECT VISITOR ================= */
router.put('/:id/reject', async (req, res) => {
  try {
    const visitor = await Visitor.findByIdAndUpdate(
      req.params.id,
      { status: 'Rejected' },
      { new: true, runValidators: true }
    )
      .populate('society', 'name')
      .populate('flat', 'flatNo tower')
      .populate('resident', 'fullName mobile');

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: 'Visitor not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Visitor rejected successfully',
      data: visitor
    });
  } catch (error) {
    console.error('REJECT VISITOR ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reject visitor'
    });
  }
});

/* ================= CHECK OUT VISITOR ================= */
router.put('/:id/checkout', async (req, res) => {
  try {
    const visitor = await Visitor.findByIdAndUpdate(
      req.params.id,
      {
        status: 'Checked Out',
        checkOutTime: new Date()
      },
      { new: true, runValidators: true }
    )
      .populate('society', 'name')
      .populate('flat', 'flatNo tower')
      .populate('resident', 'fullName mobile')
      .populate('securityGuard', 'fullName');

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: 'Visitor not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Visitor checked out successfully',
      data: visitor
    });
  } catch (error) {
    console.error('CHECKOUT VISITOR ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to checkout visitor'
    });
  }
});

/* ================= UPDATE VISITOR ================= */
router.put('/:id', async (req, res) => {
  try {
    const {
      visitorName,
      visitorPhone,
      visitorType,
      vehicleNumber,
      numberOfPeople,
      photo
    } = req.body;

    const updateData = {};
    if (visitorName) updateData.visitorName = visitorName.trim();
    if (visitorPhone) updateData.visitorPhone = visitorPhone.trim();
    if (visitorType) updateData.visitorType = visitorType;
    if (vehicleNumber) updateData.vehicleNumber = vehicleNumber.toUpperCase().trim();
    if (numberOfPeople) updateData.numberOfPeople = numberOfPeople;
    if (photo) updateData.photo = photo;

    const visitor = await Visitor.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('society', 'name')
      .populate('flat', 'flatNo tower')
      .populate('resident', 'fullName mobile')
      .populate('securityGuard', 'fullName');

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: 'Visitor not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Visitor updated successfully',
      data: visitor
    });
  } catch (error) {
    console.error('UPDATE VISITOR ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update visitor'
    });
  }
});

/* ================= DELETE VISITOR ================= */
router.delete('/:id', async (req, res) => {
  try {
    const visitor = await Visitor.findByIdAndDelete(req.params.id);

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: 'Visitor not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Visitor deleted successfully'
    });
  } catch (error) {
    console.error('DELETE VISITOR ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete visitor'
    });
  }
});

/* ================= GET VISITOR STATISTICS ================= */
router.get('/stats/summary', async (req, res) => {
  try {
    const { societyId } = req.query;

    let matchStage = {};
    if (societyId) matchStage.society = require('mongoose').Types.ObjectId(societyId);

    const stats = await Visitor.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalVisitors = await Visitor.countDocuments(matchStage);
    const todayVisitors = await Visitor.countDocuments({
      ...matchStage,
      checkInTime: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lte: new Date(new Date().setHours(23, 59, 59, 999))
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        totalVisitors,
        todayVisitors,
        byStatus: stats
      }
    });
  } catch (error) {
    console.error('GET STATS ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch visitor statistics'
    });
  }
});

export default router;
