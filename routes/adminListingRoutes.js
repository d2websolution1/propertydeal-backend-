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

// Enquiries (Supports both /api/admin/enquiries and /api/admin/listings/enquiries)
router.get('/', getEnquiries);
router.get('/enquiries', getEnquiries);
router.put('/:id', updateEnquiryStatus);
router.put('/enquiries/:id', updateEnquiryStatus);
router.delete('/:id', deleteEnquiry);
router.delete('/enquiries/:id', deleteEnquiry);
router.post('/:id/delete', deleteEnquiry);
router.post('/enquiries/:id/delete', deleteEnquiry);

export default router;