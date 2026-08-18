// routes/adminPropertyRoutes.js
import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import {
  getAllProperties,
  approveProperty,
  rejectProperty,
  toggleFeatured,
  deleteProperty,
} from '../controllers/adminPropertyController.js';

const router = express.Router();

router.use(protect, adminOnly);

router.get('/', getAllProperties);
router.patch('/:id/approve', approveProperty);
router.patch('/:id/reject', rejectProperty);
router.patch('/:id/feature', toggleFeatured);
router.delete('/:id', deleteProperty);

export default router;