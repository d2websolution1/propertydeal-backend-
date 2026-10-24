// controllers/authController.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendOtpEmail } from '../utils/emailService.js';

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'homeswale-secret-key-2025', {
    expiresIn: '30d',
  });
};

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ where: { email: cleanEmail } });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      phone: phone || null,
      role: role === 'vendor' ? 'vendor' : (role === 'admin' ? 'admin' : 'user'),
    });

    const token = generateToken(user.id);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('📝 Login attempt for email:', email);

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ where: { email: cleanEmail } });

    if (!user) {
      console.log('❌ User not found with email:', cleanEmail);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.isBlocked) {
      console.log('🚫 User account is blocked:', cleanEmail);
      return res.status(403).json({ message: 'This account has been blocked. Please contact admin.' });
    }

    // Check password: support both bcrypt hashed passwords and direct strings
    let isMatch = false;
    if (typeof user.password === 'string' && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      isMatch = (user.password === password);
    }

    if (!isMatch) {
      console.log('❌ Password mismatch for email:', cleanEmail);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.log(`✅ Login successful: ${cleanEmail} (role: ${user.role})`);

    const token = generateToken(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

// GET /api/auth/me - Get current user
export const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get user', error: error.message });
  }
};

// In-memory OTP storage (email -> { otp, expiresAt, name, phone })
const otpStore = new Map();

// POST /api/auth/send-otp - Send OTP to Gmail / Email for Client Signup or Login
export const sendOtp = async (req, res) => {
  try {
    const { email, name, phone, type = 'auth' } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Generate 6 digit numeric code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes validity

    otpStore.set(cleanEmail, {
      otp,
      expiresAt,
      name: name?.trim() || 'Valued Client',
      phone: phone?.trim() || null,
      type,
    });

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email: cleanEmail } });

    // Send email using nodemailer service
    await sendOtpEmail(cleanEmail, otp, name || (existingUser ? existingUser.name : 'Valued Client'));

    res.json({
      success: true,
      message: `Verification code sent to ${cleanEmail}`,
      isExistingUser: !!existingUser,
      // Provide preview in development/test environment for easy testing
      previewOtp: otp,
    });
  } catch (error) {
    console.error('❌ Error sending OTP:', error);
    res.status(500).json({ message: 'Failed to send verification code', error: error.message });
  }
};

// POST /api/auth/verify-otp - Verify OTP and login or create client account
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp, name, phone, password } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const storedRecord = otpStore.get(cleanEmail);

    if (!storedRecord) {
      return res.status(400).json({ message: 'No OTP requested for this email or OTP expired. Please request a new code.' });
    }

    if (Date.now() > storedRecord.expiresAt) {
      otpStore.delete(cleanEmail);
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (storedRecord.otp !== otp.trim()) {
      return res.status(400).json({ message: 'Invalid OTP code. Please enter the correct code.' });
    }

    // OTP is valid! Check if user exists
    let user = await User.findOne({ where: { email: cleanEmail } });

    if (!user) {
      // Create new client user
      const clientName = name?.trim() || storedRecord.name || cleanEmail.split('@')[0];
      const clientPassword = password || `pd_${Math.random().toString(36).substring(2, 10)}`;
      const hashedPassword = await bcrypt.hash(clientPassword, 10);

      user = await User.create({
        name: clientName,
        email: cleanEmail,
        password: hashedPassword,
        phone: phone?.trim() || storedRecord.phone || null,
        role: 'user', // Client role
      });
      console.log(`🎉 New client account registered via OTP: ${cleanEmail}`);
    } else {
      if (user.isBlocked) {
        return res.status(403).json({ message: 'This account is blocked. Please contact support.' });
      }
      console.log(`✅ Existing client authenticated via OTP: ${cleanEmail}`);
    }

    // Delete used OTP
    otpStore.delete(cleanEmail);

    const token = generateToken(user.id);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error('❌ Error verifying OTP:', error);
    res.status(500).json({ message: 'Verification failed', error: error.message });
  }
};

// POST /api/auth/google-auth - One-click Google Client Sign In / Sign Up
export const googleAuth = async (req, res) => {
  try {
    const { email, name, avatar, phone } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required for Google Sign-in' });
    }

    const cleanEmail = email.toLowerCase().trim();
    let user = await User.findOne({ where: { email: cleanEmail } });

    if (!user) {
      const generatedPassword = await bcrypt.hash(`google_${Math.random()}`, 10);
      user = await User.create({
        name: name?.trim() || cleanEmail.split('@')[0],
        email: cleanEmail,
        password: generatedPassword,
        phone: phone || null,
        role: 'user',
      });
      console.log(`🎉 New client account created via Google: ${cleanEmail}`);
    } else if (user.isBlocked) {
      return res.status(403).json({ message: 'Account is blocked. Please contact support.' });
    }

    const token = generateToken(user.id);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error('❌ Google auth error:', error);
    res.status(500).json({ message: 'Google authentication failed', error: error.message });
  }
};