// controllers/adminPropertyController.js
import { Op } from 'sequelize';
import Property from '../models/Property.js';
import User from '../models/User.js';

// GET /api/admin/properties?status=&search=&page=1&limit=10
export const getAllProperties = async (req, res) => {
  try {
    const { status = '', search = '', page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where = {};
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { city: { [Op.like]: `%${search}%` } },
        { uniqueCode: { [Op.like]: `%${search}%` } },
      ];
    }

    const { rows, count } = await Property.findAndCountAll({
      where,
      include: [{ model: User, as: 'owner', attributes: ['id', 'name', 'email'] }],
      limit: Number(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      properties: rows,
      total: count,
      page: Number(page),
      totalPages: Math.ceil(count / Number(limit)),
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch properties', error: error.message });
  }
};

// PATCH /api/admin/properties/:id/approve
export const approveProperty = async (req, res) => {
  try {
    const property = await Property.findByPk(req.params.id);
    if (!property) return res.status(404).json({ message: 'Property not found' });

    property.status = 'approved';
    property.rejectionReason = null;

    // Generate a unique listing code the first time it's approved
    if (!property.uniqueCode) {
      property.uniqueCode = `HSG-${property.id}-${Date.now().toString(36).toUpperCase()}`;
    }

    await property.save();
    res.json({ message: 'Property approved', property });
  } catch (error) {
    res.status(500).json({ message: 'Failed to approve property', error: error.message });
  }
};

// PATCH /api/admin/properties/:id/reject
export const rejectProperty = async (req, res) => {
  try {
    const { reason } = req.body;
    const property = await Property.findByPk(req.params.id);
    if (!property) return res.status(404).json({ message: 'Property not found' });

    property.status = 'rejected';
    property.rejectionReason = reason || 'Did not meet listing guidelines';
    await property.save();

    res.json({ message: 'Property rejected', property });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reject property', error: error.message });
  }
};

// PATCH /api/admin/properties/:id/feature
export const toggleFeatured = async (req, res) => {
  try {
    const property = await Property.findByPk(req.params.id);
    if (!property) return res.status(404).json({ message: 'Property not found' });

    property.isFeatured = !property.isFeatured;
    await property.save();

    res.json({ message: 'Featured status updated', property });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update featured status', error: error.message });
  }
};

// DELETE /api/admin/properties/:id
export const deleteProperty = async (req, res) => {
  try {
    const property = await Property.findByPk(req.params.id);
    if (!property) return res.status(404).json({ message: 'Property not found' });

    await property.destroy();
    res.json({ message: 'Property deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete property', error: error.message });
  }
};