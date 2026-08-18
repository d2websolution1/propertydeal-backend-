import express from 'express';
import { getPublicSeo } from '../controllers/seoController.js';

const router = express.Router();

router.get('/:pageKey', getPublicSeo);

export default router;