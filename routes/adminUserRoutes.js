// routes/adminUserRoutes.js
import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import {
  getAllUsers,
  blockUser,
  unblockUser,
  deleteUser,
} from '../controllers/adminUserController.js';

const router = express.Router();

// All routes here require a logged-in admin
router.use(protect, adminOnly);

router.get('/', getAllUsers);
router.patch('/:id/block', blockUser);
router.patch('/:id/unblock', unblockUser);
router.delete('/:id', deleteUser);

export default router;