// routes/enquiryRoutes.js
import express from 'express';
import { createEnquiry } from '../controllers/adminListingController.js';

const router = express.Router();

// Public route to submit an enquiry
router.post('/', createEnquiry);

export default router;
