// routes/subscriptionRoutes.js
import express from 'express';
import { getPublicPlans, subscribePlan, requestSubscriptionPlan } from '../controllers/subscriptionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/plans', getPublicPlans);
router.post('/subscribe', protect, subscribePlan);
router.post('/request', requestSubscriptionPlan);

export default router;

