// routes/userRoutes.js
import express from 'express';
import {
  toggleFavorite,
  getFavorites,
  requestAgentUpgrade,
  adminUpdateAgentStatus,
} from '../controllers/userFeaturesController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/favorites', protect, getFavorites);
router.post('/favorites/:propertyId', protect, toggleFavorite);
router.post('/request-agent', protect, requestAgentUpgrade);
router.put('/admin/:id/agent-status', protect, adminOnly, adminUpdateAgentStatus);

export default router;
