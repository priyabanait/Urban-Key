import express from "express";
import multer from "multer";
import Amenity from "../models/AmenityName.js";
import cloudinary, { uploadToCloudinary } from "../config/cloudinary.js";

const router = express.Router();

/* ================= MULTER MEMORY STORAGE ================= */

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

/* ================= CREATE AMENITY ================= */

router.post("/", upload.single("amenityImage"), async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Amenity name is required",
      });
    }

    const existing = await Amenity.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Amenity already exists",
      });
    }

    let imageData = null;

    if (req.file) {
      // Convert buffer to base64
      const base64String = req.file.buffer.toString('base64');
      const dataURI = `data:${req.file.mimetype};base64,${base64String}`;
      
      const result = await uploadToCloudinary(dataURI);

      imageData = {
        url: result.secure_url,
        publicId: result.public_id,
      };
    }

    const amenity = await Amenity.create({
      name,
      amenityImage: imageData,
    });

    res.status(201).json({
      success: true,
      message: "Amenity created successfully",
      data: amenity,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating amenity",
      error: error.message,
    });
  }
});

/* ================= GET ALL ================= */

router.get("/", async (req, res) => {
  try {
    const amenities = await Amenity.find().sort({ name: 1 });

    res.json({
      success: true,
      data: amenities,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching amenities",
      error: error.message,
    });
  }
});

/* ================= UPDATE ================= */

router.put("/:id", upload.single("amenityImage"), async (req, res) => {
  try {
    const amenity = await Amenity.findById(req.params.id);

    if (!amenity) {
      return res.status(404).json({
        success: false,
        message: "Amenity not found",
      });
    }

    if (req.body.name) {
      amenity.name = req.body.name;
    }

    if (req.file) {
      // delete old image from cloudinary
      if (amenity.amenityImage?.publicId) {
        await cloudinary.uploader.destroy(amenity.amenityImage.publicId);
      }

      // Convert buffer to base64
      const base64String = req.file.buffer.toString('base64');
      const dataURI = `data:${req.file.mimetype};base64,${base64String}`;
      
      const result = await uploadToCloudinary(dataURI);

      amenity.amenityImage = {
        url: result.secure_url,
        publicId: result.public_id,
      };
    }

    await amenity.save();

    res.json({
      success: true,
      message: "Amenity updated successfully",
      data: amenity,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating amenity",
      error: error.message,
    });
  }
});

/* ================= DELETE ================= */

router.delete("/:id", async (req, res) => {
  try {
    const amenity = await Amenity.findById(req.params.id);

    if (!amenity) {
      return res.status(404).json({
        success: false,
        message: "Amenity not found",
      });
    }

    if (amenity.amenityImage?.publicId) {
      await cloudinary.uploader.destroy(amenity.amenityImage.publicId);
    }

    await amenity.deleteOne();

    res.json({
      success: true,
      message: "Amenity deleted successfully",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting amenity",
      error: error.message,
    });
  }
});

export default router;