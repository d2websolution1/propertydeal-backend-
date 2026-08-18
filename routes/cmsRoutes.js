import express from 'express';
import { getPublicCmsPage } from '../controllers/cmsController.js';
const router = express.Router();
router.get('/:slug', getPublicCmsPage);
export default router;