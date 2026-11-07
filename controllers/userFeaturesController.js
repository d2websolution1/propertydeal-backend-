// controllers/userFeaturesController.js
import User from '../models/User.js';
import Property from '../models/Property.js';
import { sanitizeUser } from './authController.js';

// POST /api/users/favorites/:propertyId - Toggle favorite property
export const toggleFavorite = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { propertyId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!Array.isArray(user.favorites)) {
      user.favorites = [];
    }

    const strId = String(propertyId);
    const index = user.favorites.findIndex((id) => String(id) === strId);

    let isFavorited = false;
    if (index > -1) {
      user.favorites.splice(index, 1);
      isFavorited = false;
    } else {
      user.favorites.push(propertyId);
      isFavorited = true;
    }

    await user.save();

    res.json({
      success: true,
      isFavorited,
      favorites: user.favorites,
      message: isFavorited ? 'Property added to your Favorites' : 'Property removed from Favorites',
    });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ success: false, message: 'Failed to update favorites', error: error.message });
  }
};

// GET /api/users/favorites - Get all favorited properties of the user
export const getFavorites = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId).populate({
      path: 'favorites',
      model: 'Property',
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const validFavorites = (user.favorites || []).filter(Boolean);

    res.json({
      success: true,
      favorites: validFavorites,
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch favorites', error: error.message });
  }
};

// POST /api/users/request-agent - Owner requests upgrade to Real Estate Agent / Project Owner
export const requestAgentUpgrade = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const {
      companyName,
      reraNumber,
      city,
      experience,
      operatingLocalities,
    } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.agentRequestStatus = 'pending';
    user.agentRequestDetails = {
      companyName: companyName?.trim() || '',
      reraNumber: reraNumber?.trim() || '',
      city: city?.trim() || user.city || '',
      experience: experience?.trim() || '',
      operatingLocalities: operatingLocalities?.trim() || '',
      requestedAt: new Date(),
    };

    if (companyName) user.companyName = companyName.trim();
    if (reraNumber) user.reraNumber = reraNumber.trim();

    await user.save();

    res.json({
      success: true,
      message: 'Agent registration request submitted for admin verification!',
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('Error submitting agent upgrade request:', error);
    res.status(500).json({ success: false, message: 'Failed to submit agent request', error: error.message });
  }
};

// PUT /api/admin/users/:id/agent-status - Admin approves, rejects, or changes user function
export const adminUpdateAgentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { userType, isVerifiedAgent, agentRequestStatus } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (userType) {
      user.userType = ['Owner', 'Dealer / Agent', 'Builder'].includes(userType) ? userType : user.userType;
    }

    if (typeof isVerifiedAgent === 'boolean') {
      user.isVerifiedAgent = isVerifiedAgent;
    }

    if (agentRequestStatus) {
      user.agentRequestStatus = agentRequestStatus;
      if (agentRequestStatus === 'approved') {
        user.userType = 'Dealer / Agent';
        user.isVerifiedAgent = true;
      }
    }

    await user.save();

    res.json({
      success: true,
      message: 'User agent status & verification updated successfully',
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('Error updating agent status:', error);
    res.status(500).json({ success: false, message: 'Failed to update agent status', error: error.message });
  }
};
