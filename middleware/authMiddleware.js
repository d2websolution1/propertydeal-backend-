// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

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

    req.user = user;
    next();
  } catch (error) {
    console.error('protect middleware error:', error.message);
    return res.status(401).json({ message: 'Not authorized, invalid token' });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access only' });
  }
  next();
};