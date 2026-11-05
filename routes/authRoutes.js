// routes/authRoutes.js
import express from 'express';
import {
  register,
  login,
  getMe,
  sendOtp,
  verifyOtp,
  googleAuth,
  instantGmailAuth,
  updateProfile,
  mobileRegister,
  mobileLogin,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/mobile-register', mobileRegister);
router.post('/mobile-login', mobileLogin);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/google-auth', googleAuth);
router.post('/instant-gmail', instantGmailAuth);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

export default router;
