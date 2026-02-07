import express from 'express';
import City from '../models/City.js';

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
   GET SOCIETIES BY CITY (+ STATE)
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

    const societies = city.societies.filter(s => s.isActive !== false);
    res.json(societies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ======================================================
   GET CITY BY ID
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

/* ======================================================
   CREATE CITY (WITH SOCIETIES)
====================================================== */
router.post('/', async (req, res) => {
  try {
    const { name, state, country, societies, coordinates, isActive } = req.body;

    if (!name || !state) {
      return res.status(400).json({ error: 'Name and state are required' });
    }

    const city = new City({
      name: name.trim(),
      state: state.trim(),
      country: country || 'India',
      societies: Array.isArray(societies)
        ? societies.map(s => ({
            name: s.name?.trim(),
            code: s.code?.trim(),
            isActive: s.isActive ?? true
          }))
        : [],
      societyCount: societies?.length || 0,
      coordinates,
      isActive: isActive ?? true
    });

    await city.save();

    res.status(201).json({
      message: 'City added successfully',
      city
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'City already exists in this state' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

/* ======================================================
   UPDATE CITY (INCLUDING SOCIETIES)
====================================================== */
router.put('/:id', async (req, res) => {
  try {
    const { name, state, country, societies, coordinates, isActive } = req.body;

    const updateData = {};

    if (name) updateData.name = name.trim();
    if (state) updateData.state = state.trim();
    if (country) updateData.country = country.trim();
    if (coordinates) updateData.coordinates = coordinates;
    if (isActive !== undefined) updateData.isActive = isActive;

    if (Array.isArray(societies)) {
      updateData.societies = societies;
      updateData.societyCount = societies.length;
    }

    const city = await City.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!city) return res.status(404).json({ error: 'City not found' });

    res.json({ message: 'City updated successfully', city });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ======================================================
   SOFT / HARD DELETE CITY
====================================================== */
router.delete('/:id', async (req, res) => {
  try {
    const { permanent } = req.query;

    if (permanent === 'true') {
      const city = await City.findByIdAndDelete(req.params.id);
      if (!city) return res.status(404).json({ error: 'City not found' });
      return res.json({ message: 'City permanently deleted', city });
    }

    const city = await City.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!city) return res.status(404).json({ error: 'City not found' });

    res.json({ message: 'City deactivated successfully', city });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ======================================================
   ACTIVATE CITY
====================================================== */
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

export default router;
