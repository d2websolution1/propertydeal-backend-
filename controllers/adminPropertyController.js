// controllers/adminPropertyController.js
import mongoose from 'mongoose';
import Property from '../models/Property.js';
import User from '../models/User.js';
import { resolvePlanDetails } from '../utils/planHelper.js';

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

    // Gather all owner IDs, emails, and phones to query MongoDB Atlas Users in bulk
    // This guarantees that activePlan is always current regardless of population or stale caches
    const ownerIds = [];
    const ownerEmails = [];
    const ownerPhones = [];

    rows.forEach((r) => {
      const oid = r.owner?._id || r.owner;
      if (oid && mongoose.Types.ObjectId.isValid(oid)) {
        ownerIds.push(new mongoose.Types.ObjectId(oid));
      }
      const em = (r.ownerEmail || r.contactEmail || r.owner?.email || '').toLowerCase().trim();
      if (em) ownerEmails.push(em);

      const ph = (r.ownerPhone || r.contactPhone || r.owner?.phone || '').replace(/\D/g, '');
      if (ph && ph.length >= 10) ownerPhones.push(ph);
    });

    const userConditions = [];
    if (ownerIds.length > 0) userConditions.push({ _id: { $in: ownerIds } });
    if (ownerEmails.length > 0) userConditions.push({ email: { $in: ownerEmails } });
    if (ownerPhones.length > 0) {
      userConditions.push({
        $or: ownerPhones.map((p) => ({ phone: { $regex: p } })),
      });
    }

    let allMatchedUsers = [];
    if (userConditions.length > 0) {
      try {
        allMatchedUsers = await User.find(userConditions.length > 1 ? { $or: userConditions } : userConditions[0])
          .select('id name email phone userType role companyName reraNumber city avatar activePlan listingLimit featuredLimit')
          .lean();
      } catch (uErr) {
        console.warn('Error fetching matched users in admin properties:', uErr.message);
      }
    }

    const userById = new Map();
    const userByEmail = new Map();
    const userByPhone = new Map();

    allMatchedUsers.forEach((u) => {
      if (u._id) userById.set(u._id.toString(), u);
      if (u.id) userById.set(u.id.toString(), u);
      if (u.email) userByEmail.set(u.email.toLowerCase().trim(), u);
      if (u.phone) {
        const digits = u.phone.replace(/\D/g, '');
        if (digits) userByPhone.set(digits, u);
      }
    });

    const normalizedProperties = rows.map((r) => {
      const rawOwnerId = (r.owner?._id || r.owner || '').toString();
      const email = (r.ownerEmail || r.contactEmail || r.owner?.email || '').toLowerCase().trim();
      const phoneDigits = (r.ownerPhone || r.contactPhone || r.owner?.phone || '').replace(/\D/g, '');

      let matchedUser = null;
      if (rawOwnerId && userById.has(rawOwnerId)) {
        matchedUser = userById.get(rawOwnerId);
      } else if (email && userByEmail.has(email)) {
        matchedUser = userByEmail.get(email);
      } else if (phoneDigits && userByPhone.has(phoneDigits)) {
        matchedUser = userByPhone.get(phoneDigits);
      }

      const existingOwnerObj = r.owner && typeof r.owner === 'object' ? r.owner : {};
      const ownerObj = {
        ...existingOwnerObj,
        ...(matchedUser || {}),
        id: matchedUser?._id?.toString() || matchedUser?.id || existingOwnerObj.id || existingOwnerObj._id?.toString() || rawOwnerId,
        _id: matchedUser?._id?.toString() || matchedUser?.id || existingOwnerObj._id?.toString() || rawOwnerId,
        activePlan: matchedUser?.activePlan || existingOwnerObj.activePlan || r.selectedPlan?.name || 'Free Starter (30 Days)',
      };

      // Resolve definitive plan details:
      // If user has an activePlan set, ALWAYS prioritize it so admin and user properties show the exact plan!
      const effectivePlanName = matchedUser?.activePlan || existingOwnerObj.activePlan || r.selectedPlan?.name || 'Free Starter (30 Days)';
      const planInfo = resolvePlanDetails(effectivePlanName, r.selectedPlan?.price, r.selectedPlan?.days);

      const selectedPlan = {
        name: planInfo.name,
        price: planInfo.price,
        days: planInfo.days,
        requestedAt: r.selectedPlan?.requestedAt || new Date(),
      };

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
