// controllers/adminPropertyController.js
import mongoose from 'mongoose';
import Property from '../models/Property.js';
import User from '../models/User.js';

// GET /api/admin/properties?status=&search=&userType=&page=1&limit=12
export const getAllProperties = async (req, res) => {
  try {
    const { status = '', search = '', userType = '', page = 1, limit = 12 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 12);
    const skip = (pageNum - 1) * limitNum;

    const mongoQuery = {};
    if (status && status !== 'all') {
      mongoQuery.status = status;
    }
    if (userType && userType !== 'all') {
      mongoQuery.postedByType = userType;
    }
    if (search) {
      const s = String(search).trim();
      mongoQuery.$or = [
        { title: { $regex: s, $options: 'i' } },
        { city: { $regex: s, $options: 'i' } },
        { uniqueCode: { $regex: s, $options: 'i' } },
        { ownerName: { $regex: s, $options: 'i' } },
        { ownerEmail: { $regex: s, $options: 'i' } },
        { contactPhone: { $regex: s, $options: 'i' } },
        { locality: { $regex: s, $options: 'i' } },
      ];
    }

    const [pendingCount, approvedCount, rejectedCount, totalCount] = await Promise.all([
      Property.countDocuments({ status: 'pending' }),
      Property.countDocuments({ status: 'approved' }),
      Property.countDocuments({ status: 'rejected' }),
      Property.countDocuments({}),
    ]);

    const [rows, count] = await Promise.all([
      Property.find(mongoQuery)
        .populate('owner', 'id name email phone userType role companyName reraNumber city avatar activePlan')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Property.countDocuments(mongoQuery),
    ]);

    // Find any missing owners by email to guarantee activePlan is always present
    const unpopulatedEmails = rows
      .filter((r) => !r.owner || !r.owner.activePlan)
      .map((r) => (r.ownerEmail || r.contactEmail || '').toLowerCase().trim())
      .filter(Boolean);

    let emailUserMap = new Map();
    if (unpopulatedEmails.length > 0) {
      try {
        const users = await User.find({ email: { $in: unpopulatedEmails } })
          .select('id name email phone userType role companyName reraNumber city avatar activePlan')
          .lean();
        users.forEach((u) => {
          if (u.email) emailUserMap.set(u.email.toLowerCase().trim(), u);
        });
      } catch (uErr) {
        console.warn('Error fetching unpopulated owners in admin properties:', uErr.message);
      }
    }

    const normalizedProperties = rows.map((r) => {
      let ownerObj = r.owner || null;
      const email = (r.ownerEmail || r.contactEmail || '').toLowerCase().trim();
      if ((!ownerObj || !ownerObj.activePlan) && email && emailUserMap.has(email)) {
        ownerObj = { ...(ownerObj || {}), ...emailUserMap.get(email) };
      }

      // If user has an upgraded active plan, ensure selectedPlan reflects it
      let selectedPlan = r.selectedPlan;
      if (ownerObj?.activePlan && ownerObj.activePlan !== 'Free Starter (30 Days)') {
        selectedPlan = {
          name: ownerObj.activePlan,
          price: ownerObj.activePlan.includes('499')
            ? '₹499'
            : ownerObj.activePlan.includes('1499')
            ? '₹1499'
            : ownerObj.activePlan.includes('999')
            ? '₹999'
            : selectedPlan?.price || '₹0',
          days: selectedPlan?.days || (ownerObj.activePlan.includes('60') ? 60 : ownerObj.activePlan.includes('365') ? 365 : 30),
        };
      }

      return {
        ...r,
        id: r._id ? r._id.toString() : r.id,
        _id: r._id ? r._id.toString() : r.id,
        owner: ownerObj,
        selectedPlan,
      };
    });

    res.json({
      properties: normalizedProperties,
      total: count,
      page: pageNum,
      totalPages: Math.ceil(count / limitNum) || 1,
      counts: {
        all: totalCount,
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
      },
    });
  } catch (error) {
    console.error('getAllProperties error:', error);
    res.status(500).json({ message: 'Failed to fetch properties', error: error.message });
  }
};

// Helper to find a property by ID or PK
const findPropertyById = async (id) => {
  if (!id) return null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    const doc = await Property.findById(id);
    if (doc) return doc;
  }
  if (typeof Property.findByPk === 'function') {
    return await Property.findByPk(id);
  }
  return await Property.findOne({ $or: [{ _id: id }, { id }, { uniqueCode: id }] });
};

// PATCH or PUT /api/admin/properties/:id/approve
export const approveProperty = async (req, res) => {
  try {
    const property = await findPropertyById(req.params.id);
    if (!property) return res.status(404).json({ message: 'Property listing not found' });

    property.status = 'approved';
    property.rejectionReason = null;

    // Generate unique listing code if missing
    if (!property.uniqueCode) {
      property.uniqueCode = `PA-${Math.floor(100000 + Math.random() * 900000)}`;
    }

    await property.save();
    console.log(`✅ Property approved and now live: "${property.title}" (${property._id})`);

    res.json({
      success: true,
      message: `Property "${property.title}" approved successfully and is now Live on website!`,
      property,
    });
  } catch (error) {
    console.error('Failed to approve property:', error);
    res.status(500).json({ message: 'Failed to approve property', error: error.message });
  }
};

// PATCH or PUT /api/admin/properties/:id/reject
export const rejectProperty = async (req, res) => {
  try {
    const { reason } = req.body;
    const property = await findPropertyById(req.params.id);
    if (!property) return res.status(404).json({ message: 'Property listing not found' });

    property.status = 'rejected';
    property.rejectionReason = reason || 'Did not meet listing guidelines';
    await property.save();

    console.log(`❌ Property rejected: "${property.title}" (${property._id})`);

    res.json({
      success: true,
      message: 'Property listing rejected',
      property,
    });
  } catch (error) {
    console.error('Failed to reject property:', error);
    res.status(500).json({ message: 'Failed to reject property', error: error.message });
  }
};

// PATCH or PUT /api/admin/properties/:id/feature
export const toggleFeatured = async (req, res) => {
  try {
    const property = await findPropertyById(req.params.id);
    if (!property) return res.status(404).json({ message: 'Property listing not found' });

    property.isFeatured = !property.isFeatured;
    await property.save();

    res.json({
      success: true,
      message: `Property is now ${property.isFeatured ? 'Featured' : 'Standard'}`,
      property,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update featured status', error: error.message });
  }
};

// DELETE /api/admin/properties/:id
export const deleteProperty = async (req, res) => {
  try {
    const property = await findPropertyById(req.params.id);
    if (!property) return res.status(404).json({ message: 'Property listing not found' });

    if (typeof property.deleteOne === 'function') {
      await property.deleteOne();
    } else if (typeof property.destroy === 'function') {
      await property.destroy();
    } else {
      await Property.findByIdAndDelete(property._id || property.id);
    }

    res.json({ success: true, message: 'Property deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete property', error: error.message });
  }
};
