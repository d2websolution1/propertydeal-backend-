// routes/adminUserRoutes.js
import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import {
  getAllUsers,
  getUserProfile,
  updateUserProfile,
  blockUser,
  unblockUser,
  deleteUser,
  activateUserPlan,
} from '../controllers/adminUserController.js';

const router = express.Router();

// All routes here require a logged-in admin
router.use(protect, adminOnly);

router.get('/', getAllUsers);

// Plan Activation - support both body-based and path-based, PUT and POST (before /:id)
router.put('/activate-plan', activateUserPlan);
router.post('/activate-plan', activateUserPlan);
router.put('/:id/activate-plan', activateUserPlan);
router.post('/:id/activate-plan', activateUserPlan);

router.get('/:id', getUserProfile);
router.put('/:id', updateUserProfile);
router.patch('/:id/block', blockUser);
router.patch('/:id/unblock', unblockUser);
router.delete('/:id', deleteUser);

export default router;
