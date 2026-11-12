// routes/navMenuRoutes.js
import express from 'express';
import {
  getPublicNavMenus,
  getPublicNavMenuByKey,
} from '../controllers/navMenuController.js';

const router = express.Router();

router.get('/', getPublicNavMenus);
router.get('/:key', getPublicNavMenuByKey);

export default router;

