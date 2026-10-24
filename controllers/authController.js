// controllers/authController.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

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