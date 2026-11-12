// routes/adminNavMenuRoutes.js
import express from 'express';
import {
  getAllNavMenusAdmin,
  updateNavMenuAdmin,
  resetNavMenusAdmin,
} from '../controllers/navMenuController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, adminOnly, getAllNavMenusAdmin);
router.put('/:key', protect, adminOnly, updateNavMenuAdmin);
router.post('/reset', protect, adminOnly, resetNavMenusAdmin);

export default router;
