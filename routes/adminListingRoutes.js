// routes/adminListingRoutes.js
import express from 'express';
import {
  getFeaturedListings,
  toggleFeatured,
  removeFeatured,
  getVerifiedProperties,
  toggleVerified,
  getEnquiries,
  updateEnquiryStatus,
  deleteEnquiry
} from '../controllers/adminListingController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected and admin only
router.use(protect, adminOnly);

// Featured Listings
router.get('/featured', getFeaturedListings);
router.put('/:id/featured', toggleFeatured);
router.delete('/:id/featured', removeFeatured);

// Verified Tags
router.get('/verified', getVerifiedProperties);
router.put('/:id/verify', toggleVerified);

// Enquiries
router.get('/enquiries', getEnquiries);
router.put('/enquiries/:id', updateEnquiryStatus);
router.delete('/enquiries/:id', deleteEnquiry);

export default router;