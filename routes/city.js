import express from 'express';
import City from '../models/City.js';
import Society from '../models/Society.js';

const router = express.Router();

/* ======================================================
   GET ALL CITIES
====================================================== */
router.get('/', async (req, res) => {
  try {
    const { isActive, search } = req.query;

    const query = {};

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { state: { $regex: search, $options: 'i' } }
      ];
    }

    const cities = await City.find(query).sort({ name: 1 });
    res.json(cities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


/* ======================================================
   CREATE CITY (WITH SOCIETIES)
====================================================== */
router.post('/', async (req, res) => {
  try {
    const { name, state, country, societies, coordinates, isActive } = req.body;

    if (!name || !state) {
      return res.status(400).json({ error: 'Name and state are required' });
    }

    // Normalize coordinates: accept {latitude, longitude} or [lng, lat] or GeoJSON
    let coords = undefined;
    if (coordinates) {
      if (Array.isArray(coordinates) && coordinates.length >= 2) {
        coords = { type: 'Point', coordinates: [Number(coordinates[0]), Number(coordinates[1])] };
      } else if (coordinates.latitude !== undefined && coordinates.longitude !== undefined) {
        coords = { type: 'Point', coordinates: [Number(coordinates.longitude), Number(coordinates.latitude)] };
      } else if (coordinates.type === 'Point' && Array.isArray(coordinates.coordinates)) {
        coords = coordinates;
      }
    }

    const city = new City({
      name: name.trim(),
      state: state.trim(),
      country: country || 'India',
      coordinates: coords,
      isActive: isActive ?? true
    });

    await city.save();

    // If societies were provided in request, create separate Society documents
    if (Array.isArray(societies) && societies.length > 0) {
      const toCreate = societies.map(s => ({
        name: s.name?.trim(),
        code: s.code?.trim(),
        city: city._id,
        isActive: s.isActive ?? true
      }));
      try {
        await Society.insertMany(toCreate, { ordered: false });
      } catch (err) {
        // ignore duplicate errors for bulk insert
      }
    }

    res.status(201).json({ message: 'City added successfully', city });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'City already exists in this state' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

/* ======================================================
   BULK ADD CITIES
====================================================== */
router.post('/bulk', async (req, res) => {
  try {
    const { cities } = req.body;
    if (!Array.isArray(cities)) {
      return res.status(400).json({ error: 'Cities array required' });
    }

    const result = await City.insertMany(cities, { ordered: false });

    res.status(201).json({
      message: `${result.length} cities added`,
      cities: result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ======================================================
   STATS
====================================================== */
router.get('/stats/summary', async (req, res) => {
  try {
    const total = await City.countDocuments();
    const active = await City.countDocuments({ isActive: true });
    const inactive = await City.countDocuments({ isActive: false });

    res.json({ total, active, inactive });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ======================================================
   GET SOCIETIES BY CITY NAME
====================================================== */
router.get('/societies/:cityName', async (req, res) => {
  try {
    const { cityName } = req.params;
    const { state } = req.query;

    const query = {
      name: { $regex: `^${cityName}$`, $options: 'i' }
    };

    if (state) {
      query.state = { $regex: `^${state}$`, $options: 'i' };
    }

    const city = await City.findOne(query);
    if (!city) return res.json([]);

    const societies = await Society.find({ city: city._id, isActive: { $ne: false } }).sort({ name: 1 });
    res.json(societies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ======================================================
   SPECIAL ROUTES (before generic /:id)
====================================================== */

/* GET societies by city ID */
router.get('/:cityId/societies', async (req, res) => {
  try {
    const { cityId } = req.params;

    const city = await City.findById(cityId);
    if (!city) return res.status(404).json({ error: 'City not found', data: [] });

    const societies = await Society.find({ city: city._id, isActive: { $ne: false } }).sort({ name: 1 });
    res.json(societies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ACTIVATE CITY */
router.patch('/:id/activate', async (req, res) => {
  try {
    const city = await City.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    );

    if (!city) return res.status(404).json({ error: 'City not found' });

    res.json({ message: 'City activated successfully', city });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* UPDATE CITY (INCLUDING SOCIETIES) */
router.put('/:id', async (req, res) => {
  try {
    const { name, state, country, societies, coordinates, isActive } = req.body;

    const updateData = {};

    if (name) updateData.name = name.trim();
    if (state) updateData.state = state.trim();
    if (country) updateData.country = country.trim();
    if (coordinates) {
      // Normalize for update as well
      if (Array.isArray(coordinates) && coordinates.length >= 2) {
        updateData.coordinates = { type: 'Point', coordinates: [Number(coordinates[0]), Number(coordinates[1])] };
      } else if (coordinates.latitude !== undefined && coordinates.longitude !== undefined) {
        updateData.coordinates = { type: 'Point', coordinates: [Number(coordinates.longitude), Number(coordinates.latitude)] };
      } else if (coordinates.type === 'Point' && Array.isArray(coordinates.coordinates)) {
        updateData.coordinates = coordinates;
      }
    }
    if (isActive !== undefined) updateData.isActive = isActive;

    if (Array.isArray(societies)) {
      // After updating city, upsert provided societies as separate documents
      updateData.societies = undefined; // ensure we don't store nested societies
    }

    const city = await City.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!city) return res.status(404).json({ error: 'City not found' });

    // Handle societies: delete old ones and insert new ones
    if (Array.isArray(societies)) {
      try {
        // First, delete all old societies for this city
        await Society.deleteMany({ city: city._id });
      } catch (err) {
        console.error('Error deleting old societies:', err);
      }

      // Then, insert all new societies
      if (societies.length > 0) {
        const toCreate = societies
          .filter(s => s.name) // Only include societies with names
          .map(s => ({
            name: s.name.trim(),
            code: s.code?.trim() || '',
            city: city._id,
            isActive: s.isActive ?? true
          }));

        if (toCreate.length > 0) {
          try {
            await Society.insertMany(toCreate, { ordered: false });
          } catch (err) {
            console.error('Error inserting new societies:', err);
          }
        }
      }
    }

    res.json({ message: 'City updated successfully', city });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* SOFT / HARD DELETE CITY */
router.delete('/:id', async (req, res) => {
  try {
    const { permanent } = req.query;

    if (permanent === 'true') {
      // Permanent delete: remove city and all associated societies
      const city = await City.findByIdAndDelete(req.params.id);
      if (!city) return res.status(404).json({ error: 'City not found' });
      
      // Delete all societies associated with this city
      try {
        await Society.deleteMany({ city: city._id });
      } catch (err) {
        console.error('Error deleting societies for deleted city:', err);
      }
      
      return res.json({ message: 'City permanently deleted', city });
    }

    // Soft delete: deactivate city and associated societies
    const city = await City.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!city) return res.status(404).json({ error: 'City not found' });

    // Deactivate all societies associated with this city
    try {
      await Society.updateMany(
        { city: city._id },
        { $set: { isActive: false } }
      );
    } catch (err) {
      console.error('Error deactivating societies for deactivated city:', err);
    }

    res.json({ message: 'City deactivated successfully', city });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ======================================================
   GET CITY BY ID (MUST BE LAST - most generic pattern)
====================================================== */
router.get('/:id', async (req, res) => {
  try {
    const city = await City.findById(req.params.id);
    if (!city) return res.status(404).json({ error: 'City not found' });
    res.json(city);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
