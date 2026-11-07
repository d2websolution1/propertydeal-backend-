// controllers/adminUserController.js
import { Op } from 'sequelize';
import User from '../models/User.js';

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
