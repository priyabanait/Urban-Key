import express from 'express';
import Resident from '../models/Resident.js';
import User from '../models/User.js';
import Flat from '../models/Flat.js';
import multer from 'multer';
import { uploadToCloudinary } from '../config/cloudinary.js';

const router = express.Router();

/* ================= CREATE RESIDENT ================= */
router.post('/', async (req, res) => {
  try {
    const {
      loginId,
      fullName,
      city,
      society,
      email,
      phone,
      mobile,
      tower,
      flatNumber,
      flat: flatId,
      residentType,
      ownershipType,
      occupancyStatus,
      moveInDate,
      emergencyContact,
      documents,   // ✅ important change
      photo
    } = req.body;

    console.log('POST /api/residents - Request body:', { fullName, city, society, flatNumber });

    const finalMobile = mobile || phone;

    let finalOwnership = ownershipType || residentType || 'Flat Owner';
    finalOwnership =
      finalOwnership.toLowerCase() === 'tenant' ? 'Tenant' : 'Flat Owner';

    /* -------- REQUIRED FIELD CHECK -------- */
    if (!fullName || !finalMobile || !city || !society || !flatNumber) {
      return res.status(400).json({
        success: false,
        message: 'fullName, mobile, city, society and flatNumber are required'
      });
    }

    /* -------- DOCUMENT VALIDATION BASED ON OWNERSHIP -------- */

    if (finalOwnership === 'Flat Owner') {
      if (!documents?.photoId || !documents?.indexCopy) {
        return res.status(400).json({
          success: false,
          message: 'FlatOwner must upload photoId and indexCopy'
        });
      }
    }

    if (finalOwnership === 'Tenant') {
      if (
        !documents?.photoId ||
        !documents?.policeVerification ||
        !documents?.rentalAgreement
      ) {
        return res.status(400).json({
          success: false,
          message: 'Tenant must upload photoId, policeVerification and rentalAgreement'
        });
      }
    }

    /* -------- FIND USER (OPTIONAL) -------- */
    let user = null;
    if (loginId) {
      user = await User.findById(loginId);
    } else {
      user = await User.findOne({ mobile: finalMobile });
    }

    /* -------- DUPLICATE CHECK -------- */
    const existingResident = await Resident.findOne({ mobile: finalMobile });
    if (existingResident) {
      return res.status(400).json({
        success: false,
        message: 'Resident already exists for this mobile number'
      });
    }

    /* -------- RESOLVE FLAT -------- */
    let flatDoc = null;
    try {
      if (flatId) {
        flatDoc = await Flat.findById(flatId)
          .populate('tower', 'name')
          .populate('society', 'name');
      } else if (flatNumber) {
        flatDoc = await Flat.findOne({ flatNo: flatNumber, isActive: true })
          .populate('tower', 'name')
          .populate('society', 'name');

        if (flatDoc && society) {
          const socName = (flatDoc.society && flatDoc.society.name) || '';
          if (socName.toString().toLowerCase() !== society.toString().toLowerCase()) {
            flatDoc = null;
          }
        }
      }
    } catch (err) {
      console.error('Error resolving flat:', err);
      flatDoc = null;
    }

    /* -------- CREATE RESIDENT -------- */
    const residentPayload = {
      fullName,
      email,
      mobile: finalMobile,
      city,
      society,
      tower,
      flatNumber,
      ownershipType: finalOwnership,
      occupancyStatus: occupancyStatus || 'Currently Residing',
      moveInDate,
      photo,
      documents   // ✅ save full documents object
    };

    if (emergencyContact) {
      residentPayload.emergencyContact =
        typeof emergencyContact === 'object'
          ? emergencyContact
          : { phone: emergencyContact };
    }

    if (flatDoc) {
      residentPayload.flat = flatDoc._id;
      residentPayload.flatNumber = flatDoc.flatNo;

      if (!residentPayload.tower && flatDoc.tower)
        residentPayload.tower = flatDoc.tower.name || flatDoc.tower;

      if (!residentPayload.society && flatDoc.society)
        residentPayload.society = flatDoc.society.name || flatDoc.society;
    }

    const resident = await Resident.create(residentPayload);

    /* -------- LINK FLAT -------- */
    try {
      if (flatDoc) {
        await Flat.findByIdAndUpdate(flatDoc._id, {
          resident: resident._id,
          occupancyStatus: 'Occupied'
        });

        console.log(`✅ Flat ${flatDoc.flatNo} marked as OCCUPIED`);
      }
    } catch (linkErr) {
      console.error('Failed to link resident to flat:', linkErr);
    }

    /* -------- UPDATE USER -------- */
    if (user) {
      user.registrationCompleted = true;
      user.role = 'resident';
      await user.save();
    }

    return res.status(201).json({
      success: true,
      message: 'Resident added successfully',
      data: resident
    });

  } catch (error) {
    console.error('CREATE RESIDENT ERROR:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create resident'
    });
  }
});

/* ================= GET ALL RESIDENTS ================= */
router.get('/', async (req, res) => {
  try {
    // Supported query params:
    // - flatId (ObjectId of Flat)
    // - societyId (ObjectId of Society)
    // - towerId (ObjectId of Tower)
    // - flatNo (string or pattern)
    // - society (society name string)
    // - tower (tower name string)
    const { flatId, societyId, towerId, flatNo, society, tower, city } = req.query;

    const query = {};

    // If flatId provided, lookup Flat and use its flatNo (resident stores flatNumber as string)
    if (flatId) {
      try {
        const Flat = (await import('../models/Flat.js')).default;
        const flatData = await Flat.findById(flatId).populate('tower', 'name').lean();
        if (flatData && flatData.flatNo) {
          // Prefer exact match by resident.flat ObjectId when available (newer data)
          // Fall back to legacy heuristics (flatNumber + society/tower name) otherwise.
          query.$or = query.$or || [];
          query.$or.push({ flat: flatData._id });

          try {
            const Society = (await import('../models/Society.js')).default;
            const soc = flatData.society ? await Society.findById(flatData.society).lean() : null;

            const orClauses = [];
            // legacy flatNumber match (some residents store flatNumber as string)
            orClauses.push({ flatNumber: flatData.flatNo });
            if (soc && soc.name) orClauses.push({ society: soc.name });
            if (flatData.tower && (flatData.tower.name || flatData.tower)) orClauses.push({ tower: flatData.tower.name || flatData.tower });
            // Some legacy residents use 'buildingName' instead of 'society'
            if (soc && soc.name) orClauses.push({ buildingName: soc.name });

            // append legacy clauses into $or so any of the exact ObjectId OR legacy matches are allowed
            query.$or.push(...orClauses);
          } catch (innerErr) {
            // ignore auxiliary lookup errors
          }
        }
      } catch (err) {
        console.error('Error looking up flat:', err);
      }
    }

    console.log('GET /api/residents - Query params:', { flatId, societyId, towerId, flatNo, society, tower, city });
    
    // If societyId provided, use it directly (resident.society can be string or ObjectId)
    if (societyId) {
      // Try to support both legacy residents where `society` was stored as name string
      // and newer documents where `society` stores an ObjectId.
      try {
        const Society = (await import('../models/Society.js')).default;
        const soc = await Society.findById(societyId).lean();
        if (soc && soc.name) {
          query.$or = query.$or || [];
          query.$or.push({ society: societyId });
          query.$or.push({ society: soc.name });
          // also consider buildingName legacy field
          query.$or.push({ buildingName: soc.name });
        } else {
          // fallback to direct match by id
          query.society = societyId;
        }
      } catch (err) {
        console.error('Error looking up society for societyId filter:', err);
        query.society = societyId;
      }
      console.log('Filtered by societyId:', societyId);
    }

    // If towerId provided, lookup Tower and use its name (resident.tower stores name)
    if (towerId) {
      try {
        const Tower = (await import('../models/Tower.js')).default;
        const tow = await Tower.findById(towerId).lean();
        if (tow && tow.name) query.tower = tow.name;
      } catch (err) {
        console.error('Error looking up tower:', err);
      }
    }

    // Direct string filters
    if (flatNo) {
      query.flatNumber = { $regex: flatNo, $options: 'i' };
    }
    if (society) {
      // `society` query may be an ObjectId (sent from frontend) or a legacy society name string.
      const looksLikeObjectId = typeof society === 'string' && /^[0-9a-fA-F]{24}$/.test(society);
      if (looksLikeObjectId) {
        try {
          const Society = (await import('../models/Society.js')).default;
          const soc = await Society.findById(society).lean();
          if (soc && soc.name) {
            query.$or = query.$or || [];
            query.$or.push({ society: society }); // match by ObjectId
            query.$or.push({ society: soc.name }); // match legacy stored name
            query.$or.push({ buildingName: soc.name }); // legacy field
          } else {
            query.society = society;
          }
        } catch (err) {
          console.error('Error resolving society param:', err);
          query.society = society;
        }
      } else {
        // treat as society name
        query.$or = query.$or || [];
        query.$or.push({ society: society });
        query.$or.push({ buildingName: society });
      }
    }
    if (tower) {
      query.tower = tower;
    }
    if (city) {
      query.city = city;
    }

    console.log('GET RESIDENTS - Query params:', { flatId, societyId, towerId, flatNo, society, tower, city });
    console.log('RESIDENT QUERY:', JSON.stringify(query));
    const residents = await Resident.find(query)
      .populate({
        path: 'flat',
        select: 'flatNo flatType tower',
        populate: {
          path: 'tower',
          select: 'name'
        }
      })
      .sort({ createdAt: -1 })
      .lean();
    
    // Log sample resident to debug structure
    console.log('Sample resident:', residents[0]);

    return res.status(200).json({
      success: true,
      count: residents.length,
      data: residents
    });
  } catch (error) {
    console.error('GET RESIDENTS ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch residents'
    });
  }
});

/* ================= UPLOAD DOCUMENT FOR RESIDENT (Admin) ================= */
// Multer memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowed.includes(file.mimetype)) return cb(new Error('Only PDF or image files are allowed'));
    cb(null, true);
  }
});

/* ================= UPLOAD DOCUMENT FOR RESIDENT (by type) ================= */
router.post('/:id/upload-document/:documentType', upload.single('document'), async (req, res) => {
  try {
    const { id, documentType } = req.params;
    
    if (!req.file) return res.status(400).json({ success: false, message: 'Document file is required' });

    // Validate document type
    const validTypes = ['rentalAgreement', 'photoId', 'policeVerification', 'indexCopy'];
    if (!validTypes.includes(documentType)) {
      return res.status(400).json({ success: false, message: `Invalid document type. Allowed: ${validTypes.join(', ')}` });
    }

    const resident = await Resident.findById(id);
    if (!resident) return res.status(404).json({ success: false, message: 'Resident not found' });

    const base64String = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    const publicId = `resident_documents/${resident._id}_${documentType}_${Date.now()}`;
    const result = await uploadToCloudinary(base64String, publicId);

    // Initialize documents object if it doesn't exist
    if (!resident.documents) {
      resident.documents = {};
    }

    // Update specific document type
    resident.documents[documentType] = {
      url: result.secure_url || '',
      publicId: result.public_id || '',
      uploadedAt: new Date()
    };

    await resident.save();

    return res.json({ 
      success: true, 
      message: `${documentType} uploaded successfully`, 
      documents: resident.documents 
    });
  } catch (error) {
    console.error('Resident document upload error:', error);
    return res.status(500).json({ success: false, message: 'Failed to upload document' });
  }
});

/* ================= GET RESIDENT BY ID ================= */
router.get('/:id', async (req, res) => {
  try {
    const resident = await Resident.findById(req.params.id).populate('flat', 'flatNo flatType');
    if (!resident) {
      return res.status(404).json({
        success: false,
        message: 'Resident not found'
      });
    }

    return res.json({
      success: true,
      data: resident
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Invalid resident ID'
    });
  }
});

/* ================= UPDATE RESIDENT ================= */
router.put('/:id', async (req, res) => {
  try {
    // Get the current resident to track flat changes
    const currentResident = await Resident.findById(req.params.id);
    if (!currentResident) {
      return res.status(404).json({
        success: false,
        message: 'Resident not found'
      });
    }

    const oldFlatId = currentResident.flat;
    const newFlatId = req.body.flat;

    // Update the resident
    const updatedResident = await Resident.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    // Handle flat occupancy status changes
    try {
      // If flat changed, update status
      if (oldFlatId && newFlatId && oldFlatId.toString() !== newFlatId.toString()) {
        // Old flat becomes vacant
        await Flat.findByIdAndUpdate(oldFlatId, { 
          resident: null,
          occupancyStatus: 'Vacant'
        });
        console.log(`✅ Flat (${oldFlatId}) marked as VACANT (resident reassigned)`);

        // New flat becomes occupied
        await Flat.findByIdAndUpdate(newFlatId, { 
          resident: updatedResident._id,
          occupancyStatus: 'Occupied'
        });
        console.log(`✅ Flat (${newFlatId}) marked as OCCUPIED (resident: ${updatedResident.fullName})`);
      } 
      // If new flat assigned (was previously none)
      else if (!oldFlatId && newFlatId) {
        await Flat.findByIdAndUpdate(newFlatId, { 
          resident: updatedResident._id,
          occupancyStatus: 'Occupied'
        });
        console.log(`✅ Flat (${newFlatId}) marked as OCCUPIED (resident: ${updatedResident.fullName})`);
      }
      // If flat removed (was previously assigned)
      else if (oldFlatId && !newFlatId) {
        await Flat.findByIdAndUpdate(oldFlatId, { 
          resident: null,
          occupancyStatus: 'Vacant'
        });
        console.log(`✅ Flat (${oldFlatId}) marked as VACANT (resident unassigned)`);
      }
    } catch (flatErr) {
      console.error('Error updating flat occupancy:', flatErr);
      // Don't fail the request if flat update fails
    }

    return res.json({
      success: true,
      message: 'Resident updated successfully',
      data: updatedResident
    });
  } catch (error) {
    console.error('UPDATE RESIDENT ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Update failed'
    });
  }
});

/* ================= DELETE RESIDENT ================= */
router.delete('/:id', async (req, res) => {
  try {
    // Get resident before deleting to access flat reference
    const resident = await Resident.findById(req.params.id);
    if (!resident) {
      return res.status(404).json({
        success: false,
        message: 'Resident not found'
      });
    }

    // Mark flat as vacant before deleting resident
    if (resident.flat) {
      try {
        await Flat.findByIdAndUpdate(resident.flat, { 
          resident: null,
          occupancyStatus: 'Vacant'
        });
        console.log(`✅ Flat (${resident.flat}) marked as VACANT (resident deleted)`);
      } catch (flatErr) {
        console.error('Error updating flat to vacant:', flatErr);
        // Continue with deletion even if flat update fails
      }
    }

    // Delete the resident
    const deletedResident = await Resident.findByIdAndDelete(req.params.id);

    return res.json({
      success: true,
      message: 'Resident deleted successfully',
      data: deletedResident
    });
  } catch (error) {
    console.error('DELETE RESIDENT ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Delete failed'
    });
  }
});

export default router;
