// routes/enquiryRoutes.js
import express from 'express';
import { createEnquiry, getMyEnquiries } from '../controllers/adminListingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route to submit an enquiry (from property details page, homepage, etc.)
router.post('/', createEnquiry);

// Protected route for Dealer / Owner to fetch their leads and enquiries
router.get('/my-enquiries', protect, getMyEnquiries);

export default router;

