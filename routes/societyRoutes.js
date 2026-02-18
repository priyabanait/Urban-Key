import express from 'express';
import Society from '../models/Society.js';

const router = express.Router();

/* ================= GET ALL SOCIETIES ================= */
router.get('/', async (req, res) => {
  try {
    const societies = await Society.find({ isActive: { $ne: false } })
      .populate('city', 'name state')
      .sort({ name: 1 });
    
    res.status(200).json(societies);
  } catch (error) {
    console.error('GET SOCIETIES ERROR:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch societies'
    });
  }
});

/* ================= GET SOCIETY BY ID ================= */
router.get('/:id', async (req, res) => {
  try {
    const society = await Society.findById(req.params.id)
      .populate('city', 'name state');
    
    if (!society) {
      return res.status(404).json({ 
        success: false, 
        message: 'Society not found'
      });
    }
    
    res.status(200).json(society);
  } catch (error) {
    console.error('GET SOCIETY ERROR:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch society'
    });
  }
});

/* ================= GET SOCIETIES BY CITY ================= */
router.get('/by-city/:cityId', async (req, res) => {
  try {
    const { cityId } = req.params;
    
    const societies = await Society.find({ 
      city: cityId,
      isActive: { $ne: false } 
    }).sort({ name: 1 });
    
    res.status(200).json(societies);
  } catch (error) {
    console.error('GET SOCIETIES BY CITY ERROR:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch societies'
    });
  }
});

/* ================= CREATE SOCIETY ================= */
router.post('/', async (req, res) => {
  try {
    const { name, code, city, isActive } = req.body;
    
    if (!name || !city) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name and city are required'
      });
    }
    
    const society = await Society.create({
      name: name.trim(),
      code: code ? code.trim() : undefined,
      city,
      isActive: isActive ?? true
    });
    
    await society.populate('city', 'name state');
    
    res.status(201).json({
      success: true,
      message: 'Society created successfully',
      data: society
    });
  } catch (error) {
    console.error('CREATE SOCIETY ERROR:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to create society'
    });
  }
});

/* ================= UPDATE SOCIETY ================= */
router.put('/:id', async (req, res) => {
  try {
    const { name, code, city, isActive } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (code) updateData.code = code.trim();
    if (city) updateData.city = city;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    const society = await Society.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('city', 'name state');
    
    if (!society) {
      return res.status(404).json({ 
        success: false, 
        message: 'Society not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Society updated successfully',
      data: society
    });
  } catch (error) {
    console.error('UPDATE SOCIETY ERROR:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to update society'
    });
  }
});

/* ================= DELETE SOCIETY ================= */
router.delete('/:id', async (req, res) => {
  try {
    const society = await Society.findByIdAndDelete(req.params.id);
    
    if (!society) {
      return res.status(404).json({ 
        success: false, 
        message: 'Society not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Society deleted successfully'
    });
  } catch (error) {
    console.error('DELETE SOCIETY ERROR:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to delete society'
    });
  }
});

export default router;
