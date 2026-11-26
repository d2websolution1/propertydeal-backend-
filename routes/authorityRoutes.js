// routes/authorityRoutes.js
import express from 'express';
import Authority from '../models/Authority.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

const DEFAULT_AUTHORITIES = [
  'JDA Approved',
  'DDA Approved',
  'Collector Approved',
  'Municipal Corporation',
  'Other Collector',
  'Gram Panchayat Approved',
  'RERA Registered',
  'Freehold / Registry Ready',
];

// GET /api/authorities - public list for dropdowns
router.get('/', async (req, res) => {
  try {
    let authorities = await Authority.find({ isActive: true }).sort({ createdAt: 1 });
    if (!authorities || authorities.length === 0) {
      // Seed default authorities
      const seedDocs = DEFAULT_AUTHORITIES.map((name) => ({ name, isActive: true }));
      authorities = await Authority.insertMany(seedDocs);
    }
    res.json({
      success: true,
      authorities: authorities.map((a) => a.name),
      data: authorities,
    });
  } catch (err) {
    console.error('Error fetching authorities:', err);
    res.status(500).json({
      success: false,
      authorities: DEFAULT_AUTHORITIES,
      message: 'Failed to load authorities, returned defaults',
    });
  }
});

// Admin endpoints
// POST /api/authorities - add new authority
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Authority name is required' });
    }
    const created = await Authority.create({ name: name.trim() });
    res.status(201).json({ success: true, authority: created });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create authority', error: err.message });
  }
});

// DELETE /api/authorities/:id - delete authority
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Authority.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Authority deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete authority', error: err.message });
  }
});

export default router;
