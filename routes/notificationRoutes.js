import express from 'express';

const router = express.Router();

// Minimal notifications endpoint to avoid 404s on frontend
router.get('/', async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 100;
    // In future, fetch from DB. For now return empty list.
    const data = [];
    res.json({ success: true, count: data.length, data: data.slice(0, limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching notifications', error: error.message });
  }
});

export default router;
