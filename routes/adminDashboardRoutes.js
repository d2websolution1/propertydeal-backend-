// routes/adminDashboardRoutes.js
import express from 'express';
import { getDashboardStats } from '../controllers/adminDashboardController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, adminOnly);

router.get('/stats', getDashboardStats);

export default router;
