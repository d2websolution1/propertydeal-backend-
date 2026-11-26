// controllers/adminUserController.js
import mongoose from 'mongoose';
import { Op } from 'sequelize';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import Property from '../models/Property.js';

// GET /api/admin/users?search=&role=&page=1&limit=10
export const getAllUsers = async (req, res) => {
  try {
    const { search = '', role = '', page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    if (role) {
      where.role = role;
    }

    const { rows, count } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      limit: Number(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      users: rows,
      total: count,
      page: Number(page),
      totalPages: Math.ceil(count / Number(limit)),
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
};

// GET /api/admin/users/:id - Get full user profile
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
    });
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user profile', error: error.message });
  }
};

// PUT /api/admin/users/:id - Update user profile by Admin
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const {
      name,
      firstName,
      lastName,
      email,
      phone,
      role,
      userType,
      city,
      companyName,
      reraNumber,
      operatingSince,
      teamSize,
      localities,
      about,
      isBlocked,
      isProfileCompleted,
      isVerifiedAgent,
      agentRequestStatus,
      listingLimit,
      featuredLimit,
      activePlan,
    } = req.body;

    if (name !== undefined) user.name = name.trim();
    if (firstName !== undefined) user.firstName = firstName.trim();
    if (lastName !== undefined) user.lastName = lastName.trim();
    if (email !== undefined) user.email = email.toLowerCase().trim();
    if (phone !== undefined) user.phone = phone ? phone.trim() : null;
    if (role !== undefined && ['user', 'vendor', 'admin'].includes(role)) user.role = role;
    if (userType !== undefined) user.userType = userType;
    if (city !== undefined) user.city = city.trim();
    if (companyName !== undefined) user.companyName = companyName.trim();
    if (reraNumber !== undefined) user.reraNumber = reraNumber.trim();
    if (operatingSince !== undefined) user.operatingSince = operatingSince.trim();
    if (teamSize !== undefined) user.teamSize = teamSize.trim();
    if (localities !== undefined) user.localities = localities.trim();
    if (about !== undefined) user.about = about.trim();
    if (isBlocked !== undefined) user.isBlocked = !!isBlocked;
    if (isProfileCompleted !== undefined) user.isProfileCompleted = !!isProfileCompleted;
    if (isVerifiedAgent !== undefined) user.isVerifiedAgent = !!isVerifiedAgent;
    if (agentRequestStatus !== undefined) user.agentRequestStatus = agentRequestStatus;
    if (listingLimit !== undefined) user.listingLimit = Number(listingLimit);
    if (featuredLimit !== undefined) user.featuredLimit = Number(featuredLimit);
    if (activePlan !== undefined) user.activePlan = activePlan;

    await user.save();

    res.json({
      message: 'User profile updated successfully',
      user: {
        id: user.id || user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        userType: user.userType,
        isVerifiedAgent: user.isVerifiedAgent,
        agentRequestStatus: user.agentRequestStatus,
        listingLimit: user.listingLimit,
        featuredLimit: user.featuredLimit,
        activePlan: user.activePlan,
        city: user.city,
        companyName: user.companyName,
        reraNumber: user.reraNumber,
        about: user.about,
        isBlocked: user.isBlocked,
        isProfileCompleted: user.isProfileCompleted,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user profile', error: error.message });
  }
};

// PATCH /api/admin/users/:id/block
export const blockUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot block an admin account' });
    }

    user.isBlocked = true;
    await user.save();

    res.json({ message: 'User blocked successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to block user', error: error.message });
  }
};

// PATCH /api/admin/users/:id/unblock
export const unblockUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isBlocked = false;
    await user.save();

    res.json({ message: 'User unblocked successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to unblock user', error: error.message });
  }
};

// DELETE /api/admin/users/:id
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot delete an admin account' });
    }

    await user.destroy();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
};

// PUT or POST /api/admin/users/activate-plan (or /:id/activate-plan) - Admin directly activates/upgrades plan for a user
export const activateUserPlan = async (req, res) => {
  try {
    const rawId = req.params.id || req.body.userId || req.body.id || req.body.email || req.body.userEmail;
    const targetEmail = (req.body.email || req.body.userEmail || (typeof rawId === 'string' && rawId.includes('@') ? rawId : '')).toLowerCase().trim();
    const targetId = req.body.userId || req.body.id || (typeof rawId === 'string' && !rawId.includes('@') && rawId !== 'undefined' && rawId !== 'null' ? rawId : null);

    let user = null;

    if (targetId && mongoose.Types.ObjectId.isValid(targetId)) {
      try {
        user = await User.findById(targetId);
      } catch (e) {}
    }

    if (!user && targetEmail) {
      try {
        user = await User.findOne({ email: targetEmail });
      } catch (e) {}
    }

    if (!user && targetEmail) {
      try {
        user = await User.findOne({ email: { $regex: new RegExp(`^${targetEmail}$`, 'i') } });
      } catch (e) {}
    }

    if (!user && rawId && rawId !== 'undefined' && rawId !== 'null') {
      if (mongoose.Types.ObjectId.isValid(rawId)) {
        try {
          user = await User.findById(rawId);
        } catch (e) {}
      }
      if (!user) {
        try {
          user = await User.findOne({
            $or: [
              { email: String(rawId).toLowerCase().trim() },
              { phone: String(rawId).trim() },
            ],
          });
        } catch (e) {}
      }
    }

    if (!user && typeof User.findByPk === 'function' && targetId && mongoose.Types.ObjectId.isValid(targetId)) {
      try {
        user = await User.findByPk(targetId);
      } catch (e) {}
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User not found in database for identifier: ${targetId || targetEmail || rawId}`,
      });
    }

    const { planName, listingLimit, validityDays, featuredLimit, price } = req.body;
    const days = Number(validityDays) || 30;
    const limit = Number(listingLimit) || 5;
    const featured = Number(featuredLimit) || 0;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const chosenPlan = planName || 'Gold Owner Plan (60 Days)';

    const userDocId = user._id || user.id;

    // Use updateOne to update user document without failing on unrelated missing fields (e.g. password)
    await User.updateOne(
      { _id: userDocId },
      {
        $set: {
          activePlan: chosenPlan,
          listingLimit: limit,
          featuredLimit: (user.featuredLimit || 0) + featured,
          planExpiresAt: expiresAt,
        },
      }
    );

    // Update in-memory user object
    user.activePlan = chosenPlan;
    user.listingLimit = limit;
    user.featuredLimit = (user.featuredLimit || 0) + featured;
    user.planExpiresAt = expiresAt;

    // Immediately synchronize selectedPlan on all properties posted by this user so Manage Properties & My Listings reflect it
    try {
      const priceTag =
        Number(price) > 0
          ? `₹${price}`
          : chosenPlan.includes('499')
          ? '₹499'
          : chosenPlan.includes('1499')
          ? '₹1499'
          : chosenPlan.includes('999')
          ? '₹999'
          : '₹0';

      const userEmail = (user.email || '').toLowerCase().trim();
      const userPhone = (user.phone || '').trim();

      const orConditions = [
        { owner: userDocId },
      ];
      if (mongoose.Types.ObjectId.isValid(userDocId)) {
        orConditions.push({ owner: new mongoose.Types.ObjectId(userDocId) });
      }
      if (userEmail) {
        orConditions.push(
          { ownerEmail: userEmail },
          { contactEmail: userEmail },
          { ownerEmail: { $regex: new RegExp(`^${userEmail}$`, 'i') } },
          { contactEmail: { $regex: new RegExp(`^${userEmail}$`, 'i') } }
        );
      }
      if (userPhone) {
        orConditions.push(
          { ownerPhone: userPhone },
          { contactPhone: userPhone }
        );
      }

      await Property.updateMany(
        { $or: orConditions },
        {
          $set: {
            'selectedPlan.name': chosenPlan,
            'selectedPlan.price': priceTag,
            'selectedPlan.days': days,
          },
        }
      );
    } catch (propErr) {
      console.warn('Property sync on plan activation:', propErr.message);
    }

    // Also record completed payment for Admin audit & billing
    try {
      const txId = `ACT-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const validUserType = ['Owner', 'Dealer / Agent', 'Builder', 'Client', 'Buyer'].includes(user.userType)
        ? user.userType
        : 'Owner';

      await Payment.create({
        transactionId: txId,
        user: userDocId,
        userName: user.name || user.email || 'User',
        userEmail: user.email,
        userPhone: user.phone || '',
        userType: validUserType,
        plan: chosenPlan,
        amount:
          Number(price) >= 0
            ? Number(price)
            : chosenPlan.includes('499')
            ? 499
            : chosenPlan.includes('1499')
            ? 1499
            : chosenPlan.includes('999')
            ? 999
            : 0,
        currency: 'INR',
        status: 'completed',
        paymentMethod: 'Admin Activation / WhatsApp Chat',
        paidAt: new Date(),
        expiresAt,
        notes: `Plan activated by Admin. Listing quota updated to ${limit} properties (${days} days validity).`,
      });
    } catch (payErr) {
      console.warn('Payment logging on plan activation:', payErr.message);
    }

    console.log(`✅ Admin activated plan "${chosenPlan}" for user ${user.email} (Limit: ${limit})`);

    res.json({
      success: true,
      message: `Plan "${chosenPlan}" activated successfully for ${user.name || user.email}! Quota updated to ${limit} listings.`,
      user: {
        id: user.id || user._id,
        _id: user._id || user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        userType: user.userType,
        activePlan: chosenPlan,
        listingLimit: limit,
        featuredLimit: user.featuredLimit,
        planExpiresAt: expiresAt,
      },
    });
  } catch (error) {
    console.error('Error activating user plan:', error);
    res.status(500).json({ success: false, message: 'Failed to activate plan', error: error.message });
  }
};
