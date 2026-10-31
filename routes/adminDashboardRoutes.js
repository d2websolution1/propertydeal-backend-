import express from 'express';
import {
  getDashboardStats,
  getReportAnalytics,
  getReportListings,
  getReportUsers,
} from '../controllers/adminDashboardController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, adminOnly);

router.get('/stats', getDashboardStats);
router.get('/analytics', getReportAnalytics);
router.get('/listings', getReportListings);
router.get('/users', getReportUsers);

export default router;
