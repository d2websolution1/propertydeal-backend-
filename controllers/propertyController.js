// controllers/propertyController.js
import Property from '../models/Property.js';
import User from '../models/User.js';
import { Op } from 'sequelize';
import jwt from 'jsonwebtoken';

// GET /api/properties
export const getPublicProperties = async (req, res) => {
  try {
    const {
      listingType,
      propertyType,
      city,
      bhk,
      minPrice,
      maxPrice,
      q,
      isFeatured,
      limit = 20,
      offset = 0,
    } = req.query;

    const where = {
      status: 'approved',
    };

    if (listingType && listingType !== 'all') {
      where.listingType = listingType;
    }

    if (propertyType && propertyType !== 'all') {
      where.propertyType = { [Op.like]: `%${propertyType}%` };
    }

    if (city && city !== 'all' && city !== 'All India') {
      where.city = { [Op.like]: `%${city}%` };
    }

    if (bhk && bhk !== 'all') {
      where.bhk = { [Op.like]: `%${bhk}%` };
    }

    if (isFeatured === 'true') {
      where.isFeatured = true;
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = Number(minPrice);
      if (maxPrice) where.price[Op.lte] = Number(maxPrice);
    }

    if (q) {
      where[Op.or] = [
        { title: { [Op.like]: `%${q}%` } },
        { locality: { [Op.like]: `%${q}%` } },
        { city: { [Op.like]: `%${q}%` } },
        { propertyType: { [Op.like]: `%${q}%` } },
        { bhk: { [Op.like]: `%${q}%` } },
        { description: { [Op.like]: `%${q}%` } },
      ];
    }

    const { rows: properties, count } = await Property.findAndCountAll({
      where,
      limit: Math.min(Number(limit) || 20, 100),
      offset: Number(offset) || 0,
      order: [['isFeatured', 'DESC'], ['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email', 'phone', 'role', 'userType', 'companyName'],
        },
      ],
    });

    res.json({
      success: true,
      count,
      properties,
    });
  } catch (error) {
    console.error('Error fetching public properties:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch properties', error: error.message });
  }
};

// GET /api/properties/user/my-listings
export const getMyPropertyListings = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const userEmail = req.user.email ? req.user.email.toLowerCase().trim() : '';

    const filter = {
      $or: [
        { owner: userId },
        ...(userEmail ? [{ ownerEmail: userEmail }, { contactEmail: userEmail }] : []),
      ],
    };

    const properties = await Property.find(filter)
      .populate('owner', 'id name email phone userType companyName reraNumber avatar')
      .sort({ createdAt: -1 });

    const counts = {
      all: properties.length,
      active: properties.filter((p) => p.status === 'approved').length,
      pending: properties.filter((p) => p.status === 'pending').length,
      rejected: properties.filter((p) => p.status === 'rejected').length,
    };

    res.json({
      success: true,
      properties,
      counts,
    });
  } catch (error) {
    console.error('Error fetching user listings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch your listings', error: error.message });
  }
};

// DELETE /api/properties/user/:id
export const deleteUserProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;
    const userEmail = req.user.email ? req.user.email.toLowerCase().trim() : '';

    const property = await Property.findById(id);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    const isOwner =
      (property.owner && property.owner.toString() === userId.toString()) ||
      (property.ownerEmail && property.ownerEmail.toLowerCase().trim() === userEmail) ||
      (property.contactEmail && property.contactEmail.toLowerCase().trim() === userEmail);

    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this property' });
    }

    await Property.findByIdAndDelete(id);
    res.json({ success: true, message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).json({ success: false, message: 'Failed to delete property', error: error.message });
  }
};

// GET /api/properties/:id
export const getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;
    const property = await Property.findByPk(id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email', 'phone', 'role', 'userType', 'companyName', 'reraNumber'],
        },
      ],
    });

    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    res.json({ success: true, property });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch property', error: error.message });
  }
};

// POST /api/properties (Property submission by Owner / Dealer / Builder)
export const postPublicProperty = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      propertyType,
      listingType,
      state,
      city,
      locality,
      projectName,
      pincode,
      address,
      bhk,
      areaSqft,
      bookingAmount,
      maintenanceCharges,
      isNegotiable,
      furnishing,
      amenities,
      images,
      reraNumber,
      contactName,
      whatsappAlerts,
      qualityScore,
      ownerName,
      ownerPhone,
      ownerEmail,
      postedByType,
    } = req.body;

    if (!price || !city) {
      return res.status(400).json({ success: false, message: 'Price and city are required' });
    }

    // Auto generate clear title if left blank
    const autoTitle =
      title?.trim() ||
      [
        bhk || '',
        propertyType || 'Residential Property',
        projectName ? `in ${projectName}` : '',
        locality ? locality : '',
        city ? city : '',
      ]
        .filter(Boolean)
        .join(' ');

    // 1. Check for logged in user via Authorization Bearer token
    let authUser = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'homeswale-secret-key-2025');
        if (decoded?.id) {
          authUser = await User.findByPk(decoded.id);
        }
      } catch (e) {
        // token invalid or expired, continue with email lookup
      }
    }

    let ownerId = null;
    let resolvedUserType = postedByType || 'Owner';
    let resolvedEmail = ownerEmail?.toLowerCase().trim() || '';
    let resolvedName = contactName || ownerName || 'Property Owner';
    let resolvedPhone = ownerPhone || '';

    if (authUser) {
      ownerId = authUser.id;
      resolvedEmail = authUser.email;
      resolvedName = authUser.name || resolvedName;
      resolvedPhone = authUser.phone || resolvedPhone;
      resolvedUserType = authUser.userType || postedByType || 'Owner';
    } else if (resolvedEmail) {
      let owner = await User.findOne({ where: { email: resolvedEmail } });
      if (!owner) {
        owner = await User.create({
          name: resolvedName,
          email: resolvedEmail,
          password: 'temp_' + Math.random().toString(36).substring(7),
          phone: resolvedPhone || null,
          role: 'user',
          userType: postedByType && ['Owner', 'Dealer / Agent', 'Builder'].includes(postedByType) ? postedByType : 'Owner',
        });
      }
      ownerId = owner.id;
      resolvedUserType = owner.userType || postedByType || 'Owner';
    }

    const uniqueCode = 'HW-' + Math.floor(1000 + Math.random() * 9000);

    // If an admin posts it, auto-approve. If a user (Owner / Dealer / Builder) posts, set to pending so Admin can review & permit it!
    const initialStatus = authUser?.role === 'admin' ? 'approved' : 'pending';

    const property = await Property.create({
      title: autoTitle,
      description: description || '',
      price: Number(price),
      propertyType: propertyType || 'Apartment',
      listingType: listingType || 'sale',
      state: state || 'Uttar Pradesh',
      city: city.trim(),
      locality: locality ? locality.trim() : '',
      projectName: projectName ? projectName.trim() : '',
      pincode: pincode ? pincode.trim() : '',
      address: address ? address.trim() : '',
      bhk: bhk || '',
      areaSqft: areaSqft ? Number(areaSqft) : null,
      bookingAmount: bookingAmount ? Number(bookingAmount) : null,
      maintenanceCharges: maintenanceCharges ? Number(maintenanceCharges) : null,
      isNegotiable: !!isNegotiable,
      furnishing: furnishing || 'Semi-Furnished',
      amenities: Array.isArray(amenities) ? amenities : [],
      reraNumber: reraNumber ? reraNumber.trim() : '',
      contactName: resolvedName,
      contactEmail: resolvedEmail,
      contactPhone: resolvedPhone,
      ownerName: resolvedName,
      ownerEmail: resolvedEmail,
      ownerPhone: resolvedPhone,
      postedByType: resolvedUserType,
      whatsappAlerts: whatsappAlerts !== undefined ? !!whatsappAlerts : true,
      qualityScore: qualityScore ? Number(qualityScore) : 0,
      images:
        Array.isArray(images) && images.length
          ? images
          : ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80'],
      status: initialStatus,
      isFeatured: false,
      isVerified: authUser?.role === 'admin',
      uniqueCode,
      ownerId,
    });

    res.status(201).json({
      success: true,
      message: initialStatus === 'approved' ? 'Property posted successfully!' : 'Property submitted for admin review!',
      property,
    });
  } catch (error) {
    console.error('Error posting property:', error);
    res.status(500).json({ success: false, message: 'Failed to post property', error: error.message });
  }
};
