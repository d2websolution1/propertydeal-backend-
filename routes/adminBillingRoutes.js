// routes/adminBillingRoutes.js
import express from 'express';
import {
  getAllPayments,
  createPayment,
  updatePayment,
  updatePaymentStatus,
  deletePayment,
  getAllSubscriptions,
  createSubscription,
  updateSubscription,
} from '../controllers/adminBillingController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Payments routes
router.get('/', protect, adminOnly, getAllPayments);
router.post('/', protect, adminOnly, createPayment);
router.put('/:id', protect, adminOnly, updatePayment);
router.delete('/:id', protect, adminOnly, deletePayment);
router.post('/:id/delete', protect, adminOnly, deletePayment);
router.post('/delete/:id', protect, adminOnly, deletePayment);

// Subscriptions routes
router.get('/plans', protect, adminOnly, getAllSubscriptions);
router.post('/plans', protect, adminOnly, createSubscription);
router.put('/plans/:id', protect, adminOnly, updateSubscription);

export default router;
