// routes/propertyRoutes.js
import express from 'express';
import {
  getPublicProperties,
  getPropertyById,
  postPublicProperty,
  getMyPropertyListings,
  deleteUserProperty,
} from '../controllers/propertyController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// User specific routes (must be before /:id)
router.get('/user/my-listings', protect, getMyPropertyListings);
router.delete('/user/:id', protect, deleteUserProperty);

// Public routes
router.get('/', getPublicProperties);
router.get('/:id', getPropertyById);
router.post('/', postPublicProperty);

export default router;
