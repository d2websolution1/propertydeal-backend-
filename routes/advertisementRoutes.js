import express from 'express';
import { getPublicAds, trackClick } from '../controllers/advertisementController.js';

const router = express.Router();
router.get('/', getPublicAds);
router.post('/:id/click', trackClick);

export default router;