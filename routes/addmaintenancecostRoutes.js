import express from "express";
import AddMaintenanceCost from "../models/AddMaintenanceCost.js";

const router = express.Router();


// =============================================
// CREATE OR UPDATE MAINTENANCE (ADMIN)
// =============================================
router.post("/", async (req, res) => {
  try {
    const { society, flatType, amount, billingCycle, description } = req.body;

    if (!society || !flatType || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: "society, flatType and amount are required"
      });
    }

    // upsert (create if not exist, update if exist)
    const maintenance = await AddMaintenanceCost.findOneAndUpdate(
      { society, flatType },
      {
        amount,
        billingCycle,
        description,
        isActive: true
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: "Maintenance saved successfully",
      data: maintenance
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


// =============================================
// GET ALL MAINTENANCE BY SOCIETY
// =============================================
router.get("/society/:societyId", async (req, res) => {
  try {
    const data = await AddMaintenanceCost.find({
      society: req.params.societyId,
      isActive: true
    }).sort({ flatType: 1 });

    res.json({
      success: true,
      data
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


// =============================================
// GET MAINTENANCE BY FLAT TYPE
// =============================================
router.get("/society/:societyId/:flatType", async (req, res) => {
  try {
    const data = await AddMaintenanceCost.findOne({
      society: req.params.societyId,
      flatType: req.params.flatType,
      isActive: true
    });

    res.json({
      success: true,
      data
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


// =============================================
// DELETE MAINTENANCE
// =============================================
router.delete("/:id", async (req, res) => {
  try {
    await AddMaintenanceCost.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Maintenance deleted"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updated = await AddMaintenanceCost.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json({
      success: true,
      message: "Maintenance updated",
      data: updated
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
