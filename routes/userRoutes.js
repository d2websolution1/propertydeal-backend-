// routes/userRoutes.js
import express from 'express';
import {
  toggleFavorite,
  getFavorites,
  requestAgentUpgrade,
  adminUpdateAgentStatus,
} from '../controllers/userFeaturesController.js';
import { activateUserPlan } from '../controllers/adminUserController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/favorites', protect, getFavorites);
router.post('/favorites/:propertyId', protect, toggleFavorite);
router.post('/request-agent', protect, requestAgentUpgrade);
router.put('/admin/:id/agent-status', protect, adminOnly, adminUpdateAgentStatus);

// Plan Activation fallbacks under /api/users
router.put('/admin/activate-plan', protect, adminOnly, activateUserPlan);
router.post('/admin/activate-plan', protect, adminOnly, activateUserPlan);
router.put('/admin/:id/activate-plan', protect, adminOnly, activateUserPlan);
router.post('/admin/:id/activate-plan', protect, adminOnly, activateUserPlan);

export default router;

