import express from 'express';
import {
  getAllCmsAdmin, createCmsPage, updateCmsPage, deleteCmsPage,
} from '../controllers/cmsController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();
router.get('/', protect, adminOnly, getAllCmsAdmin);
router.post('/', protect, adminOnly, createCmsPage);
router.put('/:id', protect, adminOnly, updateCmsPage);
router.delete('/:id', protect, adminOnly, deleteCmsPage);

export default router;