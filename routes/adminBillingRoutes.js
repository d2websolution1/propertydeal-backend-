// routes/adminBillingRoutes.js
import express from 'express';
import {
  getAllPayments,
  createPayment,
  updatePaymentStatus,
  getAllSubscriptions,
  createSubscription,
  updateSubscription,
} from '../controllers/adminBillingController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Payments routes
router.get('/', protect, adminOnly, getAllPayments);
router.post('/', protect, adminOnly, createPayment);
router.put('/:id', protect, adminOnly, updatePaymentStatus);

// Subscriptions routes
router.get('/plans', protect, adminOnly, getAllSubscriptions);
router.post('/plans', protect, adminOnly, createSubscription);
router.put('/plans/:id', protect, adminOnly, updateSubscription);

export default router;
