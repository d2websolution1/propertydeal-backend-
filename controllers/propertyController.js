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
      purpose,
      propertyCategory,
      propertyType,
      city,
      area,
      locality,
      bhk,
      bedrooms,
      minPrice,
      maxPrice,
      furnishing,
      constructionStatus,
      q,
      isFeatured,
      isVerified,
      limit = 30,
      offset = 0,
    } = req.query;

    const where = {
      status: 'approved',
    };

    const finalPurpose = purpose || listingType;
    if (finalPurpose && finalPurpose !== 'all') {
      where[Op.or] = [
        { listingType: finalPurpose },
        { purpose: finalPurpose },
      ];
    }

    if (propertyCategory && propertyCategory !== 'all') {
      where.propertyCategory = propertyCategory;
    }

    if (propertyType && propertyType !== 'all') {
      where.propertyType = { [Op.like]: `%${propertyType}%` };
    }

    if (city && city !== 'all' && city !== 'All India') {
      where.city = { [Op.like]: `%${city}%` };
    }

    const areaQuery = area || locality;
    if (areaQuery && areaQuery !== 'all') {
      where[Op.or] = [
        ...(where[Op.or] || []),
        { locality: { [Op.like]: `%${areaQuery}%` } },
        { projectName: { [Op.like]: `%${areaQuery}%` } },
        { areas: { [Op.like]: `%${areaQuery}%` } },
      ];
    }

    const bedroomQuery = bedrooms || bhk;
    if (bedroomQuery && bedroomQuery !== 'all') {
      where[Op.or] = [
        ...(where[Op.or] || []),
        { bhk: { [Op.like]: `%${bedroomQuery}%` } },
        { bedrooms: { [Op.like]: `%${bedroomQuery}%` } },
      ];
    }

    if (furnishing && furnishing !== 'all') {
      where.furnishing = furnishing;
    }

    if (constructionStatus && constructionStatus !== 'all') {
      where.constructionStatus = constructionStatus;
    }

    if (isFeatured === 'true') {
      where.isFeatured = true;
    }

    if (isVerified === 'true') {
      where.isVerified = true;
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = Number(minPrice);
      if (maxPrice) where.price[Op.lte] = Number(maxPrice);
    }

    if (q) {
      where[Op.or] = [
        ...(where[Op.or] || []),
        { title: { [Op.like]: `%${q}%` } },
        { locality: { [Op.like]: `%${q}%` } },
        { city: { [Op.like]: `%${q}%` } },
        { propertyType: { [Op.like]: `%${q}%` } },
        { projectName: { [Op.like]: `%${q}%` } },
        { bhk: { [Op.like]: `%${q}%` } },
        { description: { [Op.like]: `%${q}%` } },
      ];
    }

    const { rows: properties, count } = await Property.findAndCountAll({
      where,
      limit: Math.min(Number(limit) || 30, 100),
      offset: Number(offset) || 0,
      order: [['isFeatured', 'DESC'], ['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email', 'phone', 'role', 'userType', 'companyName', 'isVerifiedAgent'],
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
      purpose,
      listingType,
      propertyCategory,
      propertyType,
      otherPropertyType,
      sizeType,
      size,
      areaSqft,
      sizeUnit,
      plotFrontFt,
      plotDepthFt,
      frontRoadFt,
      isCorner,
      isParkFacing,
      isTwoSideOpen,
      facing,
      constructionStatus,
      furnishing,
      facilities,
      amenities,
      bedrooms,
      bathrooms,
      hall,
      kitchen,
      balcony,
      parking,
      images,
      featuredImage,
      state,
      city,
      locality,
      areas,
      subAreas,
      projectName,
      pincode,
      address,
      bhk,
      bookingAmount,
      maintenanceCharges,
      isNegotiable,
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

    // 1. Check for logged in user via Authorization Bearer token
    let authUser = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'property-adda-secret-key-2025');
        if (decoded?.id) {
          authUser = await User.findByPk(decoded.id);
        }
      } catch (e) {
        // token invalid or expired, continue with email lookup
      }
    }

    // Check Listing Quota for logged in user (if not admin)
    if (authUser && authUser.role !== 'admin') {
      const userActiveListingsCount = await Property.countDocuments({
        $or: [
          { owner: authUser._id },
          ...(authUser.email ? [{ ownerEmail: authUser.email.toLowerCase() }] : []),
        ],
      });

      const allowedLimit = authUser.listingLimit !== undefined ? authUser.listingLimit : 2;
      if (userActiveListingsCount >= allowedLimit) {
        return res.status(403).json({
          success: false,
          quotaExceeded: true,
          message: `Listing limit reached! You have already posted ${userActiveListingsCount} of ${allowedLimit} allowed properties on your current plan (${authUser.activePlan || 'Free Plan'}). Please subscribe to a plan to list more properties.`,
        });
      }
    }

    const finalPurpose = purpose || listingType || 'sale';
    const finalSize = Number(size) || Number(areaSqft) || null;
    const finalPrice = Number(price);
    const calculatedPerUnit = finalPrice && finalSize && finalSize > 0 ? Math.round(finalPrice / finalSize) : null;

    // Auto generate clear title if left blank
    const autoTitle =
      title?.trim() ||
      [
        bedrooms || bhk || '',
        propertyType === 'Other' && otherPropertyType ? otherPropertyType : (propertyType || 'Residential Property'),
        finalPurpose === 'rent' ? 'For Rent' : 'For Sale',
        projectName ? `in ${projectName}` : '',
        locality || (Array.isArray(areas) ? areas.join(', ') : ''),
        city ? city : '',
      ]
        .filter(Boolean)
        .join(' ');

    let ownerId = null;
    let resolvedUserType = postedByType || 'Owner';
    let resolvedEmail = ownerEmail?.toLowerCase().trim() || '';
    let resolvedName = contactName || ownerName || 'Property Owner';
    let resolvedPhone = ownerPhone?.trim() || '';

    if (authUser) {
      ownerId = authUser._id || authUser.id;
      resolvedEmail = authUser.email || resolvedEmail;
      resolvedName = authUser.name || resolvedName;
      resolvedPhone = authUser.phone || resolvedPhone;
      resolvedUserType = authUser.userType || postedByType || 'Owner';
    } else if (resolvedEmail || resolvedPhone) {
      let owner = null;
      if (resolvedEmail) {
        owner = await User.findOne({ where: { email: resolvedEmail } });
      }
      if (!owner && resolvedPhone) {
        const cleanP = resolvedPhone.replace(/[^\d+]/g, '');
        owner = await User.findOne({
          where: {
            $or: [
              { phone: cleanP },
              { phone: cleanP.startsWith('+91') ? cleanP.replace('+91', '') : '+91' + cleanP },
            ]
          }
        });
      }
      if (!owner) {
        try {
          const autoEmail = resolvedEmail || (resolvedPhone.replace(/\D/g, '') + '@phone.property-adda.com');
          owner = await User.create({
            name: resolvedName,
            email: autoEmail,
            password: 'temp_' + Math.random().toString(36).substring(7),
            phone: resolvedPhone || null,
            role: 'user',
            userType: resolvedUserType,
            activePlan: 'Free Starter (फ्री में 2 लिस्टिंग)',
            listingLimit: 2,
          });
        } catch (createErr) {
          console.warn('Fallback finding existing user after create attempt:', createErr.message);
          if (resolvedEmail) owner = await User.findOne({ where: { email: resolvedEmail } });
        }
      }
      if (owner) {
        ownerId = owner._id || owner.id;
        resolvedUserType = owner.userType || resolvedUserType;
      }
    }

    const uniqueCode = 'PA-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900);

    // If an admin posts it, auto-approve. If a user posts, set to pending so Admin can review & permit it!
    const initialStatus = authUser?.role === 'admin' ? 'approved' : 'pending';

    const normalizedImages = Array.isArray(images) && images.length
      ? images
      : ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80'];

    const chosenFeaturedImage = featuredImage || normalizedImages[0] || '';

    const property = await Property.create({
      title: autoTitle,
      description: description || '',
      price: finalPrice,
      pricePerUnit: calculatedPerUnit,
      purpose: finalPurpose,
      listingType: finalPurpose,
      propertyCategory: propertyCategory || 'Residential',
      propertyType: propertyType || 'Flat',
      otherPropertyType: otherPropertyType || '',
      sizeType: sizeType || 'Carpet Area',
      size: finalSize,
      areaSqft: finalSize,
      sizeUnit: sizeUnit || 'sqft',
      plotFrontFt: plotFrontFt ? Number(plotFrontFt) : null,
      plotDepthFt: plotDepthFt ? Number(plotDepthFt) : null,
      frontRoadFt: frontRoadFt ? Number(frontRoadFt) : null,
      isCorner: !!isCorner,
      isParkFacing: !!isParkFacing,
      isTwoSideOpen: !!isTwoSideOpen,
      facing: Array.isArray(facing) ? facing : (facing ? [facing] : []),
      constructionStatus: constructionStatus || 'Ready to move',
      furnishing: furnishing || 'Semi-Furnished',
      facilities: Array.isArray(facilities) ? facilities : [],
      amenities: Array.isArray(amenities) ? amenities : [],
      bedrooms: bedrooms || bhk || '',
      bhk: bedrooms || bhk || '',
      bathrooms: bathrooms || '',
      hall: hall || '',
      kitchen: kitchen || '',
      balcony: balcony || '',
      parking: Array.isArray(parking) ? parking : (parking ? [parking] : []),
      images: normalizedImages,
      featuredImage: chosenFeaturedImage,
      state: state || 'Rajasthan',
      city: city.trim(),
      locality: locality ? locality.trim() : (Array.isArray(areas) && areas[0] ? areas[0] : ''),
      areas: Array.isArray(areas) ? areas : (locality ? [locality] : []),
      subAreas: Array.isArray(subAreas) ? subAreas : [],
      projectName: projectName ? projectName.trim() : '',
      pincode: pincode ? pincode.trim() : '',
      address: address ? address.trim() : '',
      bookingAmount: bookingAmount ? Number(bookingAmount) : null,
      maintenanceCharges: maintenanceCharges ? Number(maintenanceCharges) : null,
      isNegotiable: !!isNegotiable,
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
      status: initialStatus,
      isFeatured: false, // Featured by Admin only
      isVerified: false, // Verified by Admin only
      uniqueCode,
      owner: ownerId || null,
      ownerId: ownerId || null,
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
