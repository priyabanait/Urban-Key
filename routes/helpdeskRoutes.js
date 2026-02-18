import express from "express";
import Helpdesk from "../models/Helpdesk.js";
import City from "../models/City.js";
import Society from "../models/Society.js";
import User from "../models/User.js";

const router = express.Router();


// ============================================
// 1️⃣ CREATE ISSUE (Member)
// ============================================
router.post("/", async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      city,            // ✅ added
      society,
      member,
      flatNo,
      buildingName,
      priority,
    } = req.body;

    // Basic request validation to provide clear client errors
    const missing = [];
    if (!title) missing.push('title');
    if (!description) missing.push('description');
    if (!city) missing.push('city');
    if (!society) missing.push('society');
    if (!flatNo) missing.push('flatNo');
    if (!buildingName) missing.push('buildingName');
    // member is optional (admin can create issues without member)

    if (missing.length) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        missing,
      });
    }

    // Validate referenced entities
    let cityDoc = null;
    try {
      cityDoc = await City.findById(city);
    } catch (e) {
      // ignore cast errors
    }
    if (!cityDoc) {
      return res.status(400).json({ success: false, message: 'Invalid city id' });
    }

    const societyDoc = await Society.findById(society);
    if (!societyDoc) {
      return res.status(400).json({ success: false, message: 'Invalid society id' });
    }

    // If Society references a city, ensure it matches the provided city
    if (societyDoc.city) {
      const societyCityId = societyDoc.city.toString();
      if (societyCityId !== cityDoc._id.toString()) {
        return res.status(400).json({ success: false, message: 'Society does not belong to the provided city' });
      }
    }

    // If a member is provided, ensure it exists
    if (member) {
      const userDoc = await User.findById(member);
      if (!userDoc) {
        return res.status(400).json({ success: false, message: 'Invalid member id' });
      }
    }

    const issue = await Helpdesk.create({
      title,
      description,
      category,
      city: cityDoc._id.toString(),
      society: societyDoc._id,
      member: member || undefined,
      flatNo,
      buildingName,
      priority,
    });

    // Populate returned object
    const populated = await Helpdesk.findById(issue._id).populate('society', 'name').populate('member', 'name email');

    res.status(201).json({
      success: true,
      message: "Issue created successfully",
      data: populated,
    });

  } catch (error) {
    // Mongoose validation errors should return 400
    if (error && error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating issue",
      error: error.message,
    });
  }
});


// ============================================
// 2️⃣ GET ALL ISSUES (Admin Filter)
// ============================================
router.get("/", async (req, res) => {
  try {
    const { societyId, memberId, status, city } = req.query;

    const filter = {};

    if (societyId) filter.society = societyId;
    if (memberId) filter.member = memberId;
    if (status) filter.status = status;
    if (city) filter.city = city;  // ✅ added city filter

    const issues = await Helpdesk.find(filter)
      .populate("society", "name")
      .populate("member", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: issues.length,
      data: issues,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching issues",
      error: error.message,
    });
  }
});


// ============================================
// 3️⃣ GET SINGLE ISSUE
// ============================================
router.get("/:id", async (req, res) => {
  try {
    const issue = await Helpdesk.findById(req.params.id)
      .populate("society", "name")
      .populate("member", "name email");

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    res.json({
      success: true,
      data: issue,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching issue",
      error: error.message,
    });
  }
});


// ============================================
// 4️⃣ UPDATE ISSUE STATUS (Admin)
// ============================================
router.put("/:id/status", async (req, res) => {
  try {
    const { status, adminRemark } = req.body;

    const issue = await Helpdesk.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    issue.status = status;
    issue.adminRemark = adminRemark;

    if (status === "Resolved") {
      issue.resolvedAt = new Date();
    }

    await issue.save();

    res.json({
      success: true,
      message: "Issue updated successfully",
      data: issue,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating issue",
      error: error.message,
    });
  }
});


// ============================================
// 5️⃣ DELETE ISSUE
// ============================================
router.delete("/:id", async (req, res) => {
  try {
    const issue = await Helpdesk.findByIdAndDelete(req.params.id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    res.json({
      success: true,
      message: "Issue deleted successfully",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting issue",
      error: error.message,
    });
  }
});

export default router;
