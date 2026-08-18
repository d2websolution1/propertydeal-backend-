// routes/adminAdvertisementRoutes.js
import express from 'express';
import {
  getAllAdsAdmin, createAd, updateAd, deleteAd,
} from '../controllers/advertisementController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();
router.get('/', protect, adminOnly, getAllAdsAdmin);
router.post('/', protect, adminOnly, createAd);
router.put('/:id', protect, adminOnly, updateAd);
router.delete('/:id', protect, adminOnly, deleteAd);

export default router;