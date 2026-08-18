import express from 'express';
import { getAllSeoAdmin, updateSeo } from '../controllers/seoController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, adminOnly, getAllSeoAdmin);
router.put('/:id', protect, adminOnly, updateSeo);

export default router;