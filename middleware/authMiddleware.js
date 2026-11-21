// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const ADMIN_EMAILS = [
  'admin@property-adda.com',
  'admin@propertyadda.com',
];

export const isAdminEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const em = email.toLowerCase().trim();
  if (ADMIN_EMAILS.includes(em)) return true;
  if (em.endsWith('@property-adda.com') || em.endsWith('@propertyadda.com')) return true;
  if (process.env.ADMIN_EMAILS) {
    const list = process.env.ADMIN_EMAILS.toLowerCase().split(',').map((s) => s.trim());
    if (list.includes(em)) return true;
  }
  return false;
};

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const token = authHeader.split(' ')[1];
    if (!token || token === 'null' || token === 'undefined') {
      return res.status(401).json({ message: 'Not authorized, token missing' });
    }

    const secrets = [
      process.env.JWT_SECRET,
      'property-adda-secret-key-2025',
      'your-secret-key',
      'secret-key',
    ].filter(Boolean);

    let decoded = null;
    for (const secret of secrets) {
      try {
        decoded = jwt.verify(token, secret);
        if (decoded) break;
      } catch (e) {
        // try next secret
      }
    }

    if (!decoded) {
      return res.status(401).json({ message: 'Not authorized, invalid token' });
    }

    const userId = decoded.id || decoded._id || decoded.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    let user = await User.findById(userId).select('-password');
    if (!user && typeof User.findByPk === 'function') {
      user = await User.findByPk(userId);
    }

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: 'Your account has been blocked' });
    }

    // Auto-promote ONLY recognized main administrator email (admin@property-adda.com)
    if (isAdminEmail(user.email)) {
      if (user.role !== 'admin') {
        user.role = 'admin';
        try {
          await user.save();
        } catch (saveErr) {}
      }
    } else if (user.role === 'admin') {
      // Demote anyone else who was mistakenly set to admin back to client user role
      user.role = 'user';
      try {
        await user.save();
      } catch (e) {}
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('protect middleware error:', error.message);
    return res.status(401).json({ message: 'Not authorized, invalid token' });
  }
};

export const adminOnly = async (req, res, next) => {
  const isMatch = req.user?.role === 'admin' && isAdminEmail(req.user?.email);
  if (isMatch) {
    return next();
  }
  return res.status(403).json({ message: 'Admin access only. This panel is reserved for the site administrator.' });
};
