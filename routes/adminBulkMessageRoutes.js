import express from 'express';
import {
  getAudiencePreview, sendBulkMessage, getMessageHistory,
} from '../controllers/bulkMessageController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();
router.get('/audience-preview', protect, adminOnly, getAudiencePreview);
router.post('/send', protect, adminOnly, sendBulkMessage);
router.get('/history', protect, adminOnly, getMessageHistory);

export default router;