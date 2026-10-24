// routes/authRoutes.js
import express from 'express';
import { register, login, getMe, sendOtp, verifyOtp, googleAuth } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/google-auth', googleAuth);
router.get('/me', protect, getMe);

export default router;