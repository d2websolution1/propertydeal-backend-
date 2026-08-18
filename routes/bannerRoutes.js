import express from 'express';
import { getPublicBanners } from '../controllers/bannerController.js';

const router = express.Router();
router.get('/', getPublicBanners);

export default router;