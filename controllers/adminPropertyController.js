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
      if (status === 'pending') {
        mongoQuery.$or = [{ status: 'pending' }, { hasPendingEdit: true }];
      } else {
        mongoQuery.status = status;
      }
    }
    if (userType && userType !== 'all') {
      mongoQuery.postedByType = userType;
    }
    if (search) {
      const s = String(search).trim();
      const searchConditions = [
        { title: { $regex: s, $options: 'i' } },
        { city: { $regex: s, $options: 'i' } },
        { uniqueCode: { $regex: s, $options: 'i' } },
        { ownerName: { $regex: s, $options: 'i' } },
        { ownerEmail: { $regex: s, $options: 'i' } },
        { contactPhone: { $regex: s, $options: 'i' } },
        { locality: { $regex: s, $options: 'i' } },
      ];
      if (mongoQuery.$or) {
        mongoQuery.$and = [{ $or: mongoQuery.$or }, { $or: searchConditions }];
        delete mongoQuery.$or;
      } else {
        mongoQuery.$or = searchConditions;
      }
    }

    const [pendingCount, approvedCount, rejectedCount, totalCount] = await Promise.all([
      Property.countDocuments({ $or: [{ status: 'pending' }, { hasPendingEdit: true }] }),
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

    // Find any missing owners by email or phone to guarantee activePlan is always present
    const unpopulatedEmails = rows
      .filter((r) => !r.owner || !r.owner.activePlan)
      .map((r) => (r.ownerEmail || r.contactEmail || '').toLowerCase().trim())
      .filter(Boolean);

    const unpopulatedPhones = rows
      .filter((r) => !r.owner || !r.owner.activePlan)
      .map((r) => (r.ownerPhone || r.contactPhone || '').replace(/\D/g, ''))
      .filter((p) => p && p.length >= 10);

    let emailUserMap = new Map();
    if (unpopulatedEmails.length > 0 || unpopulatedPhones.length > 0) {
      try {
        const queryConditions = [];
        if (unpopulatedEmails.length > 0) queryConditions.push({ email: { $in: unpopulatedEmails } });
        if (unpopulatedPhones.length > 0) {
          queryConditions.push({
            $or: unpopulatedPhones.map((ph) => ({ phone: { $regex: ph } })),
          });
        }

        const users = await User.find(queryConditions.length > 1 ? { $or: queryConditions } : queryConditions[0])
          .select('id name email phone userType role companyName reraNumber city avatar activePlan')
          .lean();

        users.forEach((u) => {
          if (u.email) emailUserMap.set(u.email.toLowerCase().trim(), u);
          if (u.phone) {
            const digits = u.phone.replace(/\D/g, '');
            if (digits) emailUserMap.set(digits, u);
          }
        });
      } catch (uErr) {
        console.warn('Error fetching unpopulated owners in admin properties:', uErr.message);
      }
    }

    const normalizedProperties = rows.map((r) => {
      let ownerObj = r.owner || null;
      const email = (r.ownerEmail || r.contactEmail || '').toLowerCase().trim();
      const phoneDigits = (r.ownerPhone || r.contactPhone || '').replace(/\D/g, '');

      if (!ownerObj || !ownerObj.activePlan) {
        if (email && emailUserMap.has(email)) {
          ownerObj = { ...(ownerObj || {}), ...emailUserMap.get(email) };
        } else if (phoneDigits && emailUserMap.has(phoneDigits)) {
          ownerObj = { ...(ownerObj || {}), ...emailUserMap.get(phoneDigits) };
        }
      }

      // If user has an upgraded active plan, ensure selectedPlan reflects it
      let selectedPlan = r.selectedPlan;
      const ownerPlan = (ownerObj?.activePlan || '').trim();
      const isOwnerPlanFree =
        !ownerPlan ||
        ownerPlan.toLowerCase().includes('free') ||
        ownerPlan.toLowerCase().includes('starter');

      if (!isOwnerPlanFree) {
        selectedPlan = {
          name: ownerPlan,
          price: ownerPlan.includes('499')
            ? '₹499'
            : ownerPlan.includes('1499')
            ? '₹1499'
            : ownerPlan.includes('999')
            ? '₹999'
            : ownerPlan.includes('1999')
            ? '₹1999'
            : ownerPlan.includes('4999')
            ? '₹4999'
            : selectedPlan?.price || '₹499',
          days: selectedPlan?.days || (ownerPlan.includes('60') ? 60 : ownerPlan.includes('365') ? 365 : ownerPlan.includes('90') ? 90 : ownerPlan.includes('45') ? 45 : 30),
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

    // If property has pending edits submitted by owner, apply them now so they become live!
    if (property.hasPendingEdit && property.pendingEdit) {
      const editData = typeof property.pendingEdit.toObject === 'function'
        ? property.pendingEdit.toObject()
        : { ...property.pendingEdit };
      delete editData.editedAt;
      delete editData.editedBy;
      Object.assign(property, editData);
      property.hasPendingEdit = false;
      property.pendingEdit = null;
    }

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

    if (property.hasPendingEdit) {
      // Rejection of edited changes discards pending edits, keeping previous approved version live!
      property.hasPendingEdit = false;
      property.pendingEdit = null;
      property.rejectionReason = reason || 'Edited changes rejected by admin. Previous version remains live.';
    } else {
      property.status = 'rejected';
      property.rejectionReason = reason || 'Did not meet listing guidelines';
    }

    await property.save();

    console.log(`❌ Property rejected: "${property.title}" (${property._id})`);

    res.json({
      success: true,
      message: 'Property rejected / changes discarded',
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
