// routes/propertyRoutes.js
import express from 'express';
import {
  getPublicProperties,
  getPropertyById,
  postPublicProperty,
  getMyPropertyListings,
  deleteUserProperty,
  updateUserProperty,
} from '../controllers/propertyController.js';
import { approveProperty, rejectProperty } from '../controllers/adminPropertyController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin approval routes (available on /api/properties/:id/approve as well)
router.patch('/:id/approve', protect, adminOnly, approveProperty);
router.put('/:id/approve', protect, adminOnly, approveProperty);
router.patch('/:id/reject', protect, adminOnly, rejectProperty);
router.put('/:id/reject', protect, adminOnly, rejectProperty);

// User specific routes (must be before /:id)
router.get('/user/my-listings', protect, getMyPropertyListings);
router.delete('/user/:id', protect, deleteUserProperty);
router.put('/user/:id', protect, updateUserProperty);
router.put('/:id', protect, updateUserProperty);

// Public routes
router.get('/', getPublicProperties);
router.get('/:id', getPropertyById);
router.post('/', postPublicProperty);

export default router;
