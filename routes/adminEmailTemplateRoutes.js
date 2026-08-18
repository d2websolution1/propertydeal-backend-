import express from 'express';
import { getAllTemplatesAdmin, updateTemplate } from '../controllers/emailTemplateController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();
router.get('/', protect, adminOnly, getAllTemplatesAdmin);
router.put('/:id', protect, adminOnly, updateTemplate);

export default router;