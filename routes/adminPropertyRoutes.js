// routes/adminPropertyRoutes.js
import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import {
  getAllProperties,
  approveProperty,
  rejectProperty,
  toggleFeatured as toggleFeaturedAdmin,
  deleteProperty,
} from '../controllers/adminPropertyController.js';
import {
  getFeaturedListings,
  toggleFeatured,
  removeFeatured,
  getVerifiedProperties,
  toggleVerified,
} from '../controllers/adminListingController.js';

const router = express.Router();

router.use(protect, adminOnly);

// Special subroutes before /:id
router.get('/featured', getFeaturedListings);
router.get('/verified', getVerifiedProperties);

router.get('/', getAllProperties);
router.patch('/:id/approve', approveProperty);
router.patch('/:id/reject', rejectProperty);
router.patch('/:id/feature', toggleFeaturedAdmin);
router.put('/:id/featured', toggleFeatured);
router.delete('/:id/featured', removeFeatured);
router.put('/:id/verify', toggleVerified);
router.delete('/:id', deleteProperty);

export default router;