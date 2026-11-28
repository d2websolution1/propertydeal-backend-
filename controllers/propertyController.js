// controllers/propertyController.js
import mongoose from 'mongoose';
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
      location,
      area,
      locality,
      bhk,
      bedrooms,
      minPrice,
      maxPrice,
      furnishing,
      constructionStatus,
      amenities,
      facilities,
      q,
      isFeatured,
      isVerified,
      limit = 30,
      offset = 0,
    } = req.query;

    const where = {
      status: 'approved',
    };

    const andConditions = [];

    const rawPurpose = String(purpose || listingType || '').toLowerCase().trim();
    if (rawPurpose && rawPurpose !== 'all') {
      const isRent = rawPurpose.includes('rent') || rawPurpose.includes('lease');
      const isSale = rawPurpose.includes('sale') || rawPurpose.includes('buy');
      if (isRent) {
        andConditions.push({
          [Op.or]: [
            { listingType: 'rent' },
            { purpose: 'rent' },
            { listingType: { [Op.like]: '%rent%' } },
            { purpose: { [Op.like]: '%rent%' } },
            { listingType: { [Op.like]: '%lease%' } },
            { purpose: { [Op.like]: '%lease%' } },
          ],
        });
      } else if (isSale) {
        andConditions.push({
          [Op.or]: [
            { listingType: 'sale' },
            { purpose: 'sale' },
            { listingType: { [Op.like]: '%sale%' } },
            { purpose: { [Op.like]: '%sale%' } },
            { listingType: { [Op.like]: '%buy%' } },
            { purpose: { [Op.like]: '%buy%' } },
          ],
        });
      } else {
        andConditions.push({
          [Op.or]: [
            { listingType: rawPurpose },
            { purpose: rawPurpose },
            { listingType: { [Op.like]: `%${rawPurpose}%` } },
            { purpose: { [Op.like]: `%${rawPurpose}%` } },
          ],
        });
      }
    }

    if (propertyCategory && propertyCategory !== 'all') {
      where.propertyCategory = propertyCategory;
    }

    if (propertyType && propertyType !== 'all') {
      where.propertyType = { [Op.like]: `%${propertyType}%` };
    }

    // Location / City / Locality matching
    if (city && city !== 'all' && city !== 'All India') {
      where.city = { [Op.like]: `%${city.trim()}%` };
    } else if (location && location !== 'all' && location !== 'All India') {
      andConditions.push({
        [Op.or]: [
          { city: { [Op.like]: `%${location}%` } },
          { locality: { [Op.like]: `%${location}%` } },
          { address: { [Op.like]: `%${location}%` } },
          { projectName: { [Op.like]: `%${location}%` } },
        ],
      });
    }

    const areaQuery = area || locality;
    if (areaQuery && areaQuery !== 'all') {
      andConditions.push({
        [Op.or]: [
          { locality: { [Op.like]: `%${areaQuery.trim()}%` } },
          { projectName: { [Op.like]: `%${areaQuery.trim()}%` } },
          { areas: { [Op.like]: `%${areaQuery.trim()}%` } },
        ],
      });
    }

    // Sub Area / Township matching (Multiselect support)
    const subAreaQuery = req.query.subArea || req.query.subAreas || req.query.township;
    if (subAreaQuery && subAreaQuery !== 'all') {
      const subAreaList = (Array.isArray(subAreaQuery) ? subAreaQuery : String(subAreaQuery).split(','))
        .map((s) => s.trim())
        .filter(Boolean);
      if (subAreaList.length > 0) {
        andConditions.push({
          [Op.or]: [
            ...subAreaList.map((s) => ({ subAreas: { [Op.like]: `%${s}%` } })),
            ...subAreaList.map((s) => ({ projectName: { [Op.like]: `%${s}%` } })),
            ...subAreaList.map((s) => ({ address: { [Op.like]: `%${s}%` } })),
          ],
        });
      }
    }

    const bedroomQuery = bedrooms || bhk;
    if (bedroomQuery && bedroomQuery !== 'all') {
      andConditions.push({
        [Op.or]: [
          { bhk: { [Op.like]: `%${bedroomQuery}%` } },
          { bedrooms: { [Op.like]: `%${bedroomQuery}%` } },
        ],
      });
    }

    if (furnishing && furnishing !== 'all') {
      where.furnishing = furnishing;
    }

    if (constructionStatus && constructionStatus !== 'all') {
      where.constructionStatus = constructionStatus;
    }

    // Amenities / Facilities Filter
    const amenityParam = amenities || facilities;
    if (amenityParam && amenityParam !== 'all') {
      const amenityList = (Array.isArray(amenityParam) ? amenityParam : String(amenityParam).split(','))
        .map((s) => s.trim())
        .filter(Boolean);

      if (amenityList.length > 0) {
        andConditions.push({
          [Op.or]: [
            ...amenityList.map((a) => ({ amenities: { [Op.like]: `%${a}%` } })),
            ...amenityList.map((a) => ({ facilities: { [Op.like]: `%${a}%` } })),
          ],
        });
      }
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
      andConditions.push({
        [Op.or]: [
          { title: { [Op.like]: `%${q}%` } },
          { locality: { [Op.like]: `%${q}%` } },
          { city: { [Op.like]: `%${q}%` } },
          { propertyType: { [Op.like]: `%${q}%` } },
          { projectName: { [Op.like]: `%${q}%` } },
          { bhk: { [Op.like]: `%${q}%` } },
          { description: { [Op.like]: `%${q}%` } },
        ],
      });
    }

    if (andConditions.length > 0) {
      where[Op.and] = andConditions;
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

    const enrichedProperties = properties.map((p) => {
      const obj = typeof p.toJSON === 'function' ? p.toJSON() : (p.toObject ? p.toObject() : { ...p });
      const sizeVal = Number(obj.areaSqft || obj.size);
      const priceVal = Number(obj.price);
      if (priceVal && sizeVal && sizeVal > 0) {
        obj.pricePerSqft = Math.round(priceVal / sizeVal);
      } else {
        obj.pricePerSqft = null;
      }
      return obj;
    });

    res.json({
      success: true,
      count,
      properties: enrichedProperties,
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
      .populate('owner', 'id name email phone userType companyName reraNumber avatar activePlan listingLimit planExpiresAt')
      .sort({ createdAt: -1 });

    const counts = {
      all: properties.length,
      active: properties.filter((p) => p.status === 'approved').length,
      pending: properties.filter((p) => p.status === 'pending' || p.hasPendingEdit).length,
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

// PUT /api/properties/user/:id (or /api/properties/:id)
export const updateUserProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;
    const userEmail = req.user.email ? req.user.email.toLowerCase().trim() : '';

    let property = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      property = await Property.findById(id);
    }
    if (!property) {
      property = await Property.findOne({
        $or: [{ uniqueCode: id }, { _id: mongoose.Types.ObjectId.isValid(id) ? id : null }],
      });
    }

    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    const isOwner =
      (property.owner && property.owner.toString() === userId.toString()) ||
      (property.ownerEmail && property.ownerEmail.toLowerCase().trim() === userEmail) ||
      (property.contactEmail && property.contactEmail.toLowerCase().trim() === userEmail);

    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this property' });
    }

    const safeNum = (v) => {
      if (v === undefined || v === null || v === '') return undefined;
      const n = Number(v);
      return isNaN(n) ? undefined : n;
    };

    const updates = { ...req.body };
    if (updates.price !== undefined) updates.price = safeNum(updates.price);
    if (updates.size !== undefined || updates.areaSqft !== undefined) {
      const sz = safeNum(updates.size) || safeNum(updates.areaSqft);
      if (sz !== undefined) {
        updates.size = sz;
        updates.areaSqft = sz;
      }
    }
    if (updates.price && updates.size && updates.size > 0) {
      updates.pricePerUnit = Math.round(updates.price / updates.size);
    }

    delete updates.owner;
    delete updates.ownerId;
    delete updates.uniqueCode;

    // IF PROPERTY IS ALREADY APPROVED (LIVE ON SITE):
    // The previous approved version remains live on home page / search.
    // The new changes are stored in pendingEdit until admin approves!
    if (property.status === 'approved') {
      delete updates.status;
      delete updates.isApproved;

      const updated = await Property.findByIdAndUpdate(
        property._id,
        {
          $set: {
            hasPendingEdit: true,
            pendingEdit: {
              ...updates,
              editedAt: new Date(),
              editedBy: userId,
            },
          },
        },
        { new: true }
      );

      return res.json({
        success: true,
        message: 'Property changes submitted for admin approval! The previous approved version remains live until admin approves the update.',
        property: updated,
      });
    }

    if (req.user.role !== 'admin') {
      updates.status = 'pending';
      updates.isApproved = false;
      updates.hasPendingEdit = false;
      updates.pendingEdit = null;
    }

    const updated = await Property.findByIdAndUpdate(property._id, updates, { new: true });
    res.json({
      success: true,
      message: req.user.role === 'admin' ? 'Property updated successfully' : 'Property changes submitted for admin re-approval',
      property: updated,
    });
  } catch (error) {
    console.error('Error updating property:', error);
    res.status(500).json({ success: false, message: 'Failed to update property', error: error.message });
  }
};

// GET /api/properties/:id
export const getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;
    let property = null;

    if (id && mongoose.Types.ObjectId.isValid(id)) {
      property = await Property.findById(id).populate('owner', 'id name email phone role userType companyName reraNumber isVerifiedAgent');
    }

    if (!property && id) {
      property = await Property.findOne({
        $or: [
          { uniqueCode: id },
          ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : [])
        ]
      }).populate('owner', 'id name email phone role userType companyName reraNumber isVerifiedAgent');
    }

    if (!property && typeof Property.findByPk === 'function') {
      property = await Property.findByPk(id, {
        include: [
          {
            model: User,
            as: 'owner',
            attributes: ['id', 'name', 'email', 'phone', 'role', 'userType', 'companyName', 'reraNumber', 'isVerifiedAgent'],
          },
        ],
      });
    }

    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    const obj = typeof property.toJSON === 'function' ? property.toJSON() : (property.toObject ? property.toObject() : { ...property });
    const sizeVal = Number(obj.areaSqft || obj.size);
    const priceVal = Number(obj.price);
    if (priceVal && sizeVal && sizeVal > 0) {
      obj.pricePerSqft = Math.round(priceVal / sizeVal);
    } else {
      obj.pricePerSqft = null;
    }

    res.json({ success: true, property: obj });
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
      selectedPlan,
    } = req.body;

    if (!price || !city) {
      return res.status(400).json({ success: false, message: 'Price and city are required' });
    }

    const safeNum = (v) => {
      if (v === undefined || v === null || v === '') return null;
      const n = Number(v);
      return isNaN(n) ? null : n;
    };

    // 1. Check for logged in user via Authorization Bearer token (support all secret keys)
    let authUser = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const secrets = [
          process.env.JWT_SECRET,
          'property-adda-secret-key-2025',
          'your-secret-key',
        ].filter(Boolean);

        let decoded = null;
        for (const sec of secrets) {
          try {
            decoded = jwt.verify(token, sec);
            if (decoded) break;
          } catch (e) {}
        }

        const uid = decoded?.id || decoded?._id || decoded?.userId;
        if (uid) {
          authUser = await User.findById(uid);
          if (!authUser && typeof User.findByPk === 'function') {
            authUser = await User.findByPk(uid);
          }
        }
      } catch (e) {
        // token invalid or expired, continue with email lookup
      }
    }

    if (!title || !String(title).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Property Title is compulsory. Please provide a clear title.',
      });
    }

    // For client users, property is saved as pending for admin verification and plan confirmation

    const finalPurpose = String(purpose || listingType || 'sale').toLowerCase().includes('rent') ? 'rent' : 'sale';
    const finalPrice = safeNum(price) || 0;
    const finalSize = safeNum(size) || safeNum(areaSqft) || null;
    const calculatedPerUnit = finalPrice && finalSize && finalSize > 0 ? Math.round(finalPrice / finalSize) : null;

    let cleanSizeType = 'Carpet Area';
    if (sizeType) {
      const stLower = String(sizeType).toLowerCase();
      if (stLower.includes('super')) cleanSizeType = 'Super Built-up Area';
      else if (stLower.includes('plot')) cleanSizeType = 'Plot Area';
      else if (stLower.includes('carpet')) cleanSizeType = 'Carpet Area';
      else cleanSizeType = sizeType;
    }

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
      ownerId = authUser._id;
      resolvedEmail = authUser.email || resolvedEmail;
      resolvedName = authUser.name || resolvedName;
      resolvedPhone = authUser.phone || resolvedPhone;
      resolvedUserType = authUser.userType || postedByType || 'Owner';
    } else if (resolvedEmail || resolvedPhone) {
      let owner = null;
      if (resolvedEmail) {
        owner = await User.findOne({ email: resolvedEmail });
      }
      if (!owner && resolvedPhone) {
        const cleanP = resolvedPhone.replace(/[^\d+]/g, '');
        owner = await User.findOne({
          $or: [
            { phone: cleanP },
            { phone: cleanP.startsWith('+91') ? cleanP.replace('+91', '') : '+91' + cleanP },
          ],
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
            activePlan: 'Free Starter (30 Days)',
            listingLimit: 2,
          });
        } catch (createErr) {
          console.warn('Fallback finding existing user after create attempt:', createErr.message);
          if (resolvedEmail) owner = await User.findOne({ email: resolvedEmail });
        }
      }
      if (owner) {
        ownerId = owner._id;
        resolvedUserType = owner.userType || resolvedUserType;
      }
    }

    // Quota Enforcement: Check user's active plan listing limit
    const postingUser = authUser || (resolvedEmail ? await User.findOne({ email: resolvedEmail }) : null);
    if (postingUser && postingUser.role !== 'admin') {
      const userPropCount = await Property.countDocuments({
        $or: [
          { owner: postingUser._id },
          { ownerEmail: postingUser.email.toLowerCase().trim() },
        ],
      });
      const allowedLimit = postingUser.listingLimit !== undefined ? postingUser.listingLimit : 2;
      if (userPropCount >= allowedLimit) {
        return res.status(403).json({
          success: false,
          quotaExceeded: true,
          message: `Listing limit reached (${userPropCount}/${allowedLimit} properties posted). Please upgrade your subscription plan to post more properties.`,
        });
      }
    }

    let validOwnerId = null;
    if (ownerId && mongoose.Types.ObjectId.isValid(ownerId)) {
      validOwnerId = ownerId;
    }

    const uniqueCode = req.body.uniqueCode || ('PA-' + Math.floor(100000 + Math.random() * 900000));

    // If an admin posts it, auto-approve. If a user posts, set to pending so Admin can review & permit it!
    const initialStatus = authUser?.role === 'admin' ? 'approved' : 'pending';

    const normalizedImages = Array.isArray(images) && images.length > 0 && images.some(Boolean)
      ? images.filter(Boolean)
      : ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80'];

    const chosenFeaturedImage = featuredImage || normalizedImages[0] || '';

    let cleanSelectedPlan = {
      name: 'Free Starter (30 Days)',
      price: '₹0',
      days: 30,
      requestedAt: new Date(),
    };
    if (selectedPlan && typeof selectedPlan === 'object') {
      cleanSelectedPlan = {
        name: selectedPlan.name || cleanSelectedPlan.name,
        price: selectedPlan.price !== undefined ? String(selectedPlan.price) : cleanSelectedPlan.price,
        days: Number(selectedPlan.days) || 30,
        requestedAt: new Date(),
      };
    }

    const cityLower = String(city || '').toLowerCase().trim();
    let resolvedState = (state || '').trim();
    if (cityLower.includes('jaipur') || cityLower.includes('jodhpur') || cityLower.includes('udaipur') || cityLower.includes('kota')) {
      resolvedState = 'Rajasthan';
    } else if (cityLower.includes('delhi')) {
      resolvedState = 'Delhi';
    } else if (cityLower.includes('noida') || cityLower.includes('lucknow') || cityLower.includes('kanpur') || cityLower.includes('ghaziabad')) {
      resolvedState = 'Uttar Pradesh';
    } else if (cityLower.includes('gurgaon') || cityLower.includes('gurugram') || cityLower.includes('faridabad')) {
      resolvedState = 'Haryana';
    } else if (cityLower.includes('mumbai') || cityLower.includes('pune') || cityLower.includes('thane')) {
      resolvedState = 'Maharashtra';
    } else if (cityLower.includes('bangalore') || cityLower.includes('bengaluru')) {
      resolvedState = 'Karnataka';
    } else if (cityLower.includes('hyderabad')) {
      resolvedState = 'Telangana';
    } else if (resolvedState.toUpperCase() === 'UP') {
      resolvedState = '';
    }

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
      sizeType: cleanSizeType,
      size: finalSize,
      areaSqft: finalSize,
      sizeUnit: sizeUnit || 'sqft',
      plotFrontFt: safeNum(plotFrontFt),
      plotDepthFt: safeNum(plotDepthFt),
      frontRoadFt: safeNum(frontRoadFt),
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
      state: resolvedState,
      city: String(city).trim(),
      locality: locality ? locality.trim() : (Array.isArray(areas) && areas[0] ? areas[0] : ''),
      areas: Array.isArray(areas) ? areas : (locality ? [locality] : []),
      subAreas: Array.isArray(subAreas) ? subAreas : [],
      projectName: projectName ? projectName.trim() : '',
      pincode: pincode ? pincode.trim() : '',
      address: address ? address.trim() : '',
      bookingAmount: safeNum(bookingAmount),
      maintenanceCharges: safeNum(maintenanceCharges),
      isNegotiable: !!isNegotiable,
      reraNumber: reraNumber ? reraNumber.trim() : '',
      approvedAuthority: (req.body.approvedAuthority || '').trim(),
      contactName: resolvedName,
      contactEmail: resolvedEmail,
      contactPhone: resolvedPhone,
      ownerName: resolvedName,
      ownerEmail: resolvedEmail,
      ownerPhone: resolvedPhone,
      postedByType: resolvedUserType,
      whatsappAlerts: whatsappAlerts !== undefined ? !!whatsappAlerts : true,
      qualityScore: safeNum(qualityScore) || 0,
      status: initialStatus,
      isFeatured: false, // Featured by Admin only
      isVerified: false, // Verified by Admin only
      uniqueCode,
      owner: validOwnerId,
      selectedPlan: cleanSelectedPlan,
    });

    // ── Activate User's Subscription Plan from 1st day of Listing ──
    if (postingUser) {
      if (!postingUser.planStartedAt) {
        const now = new Date();
        const planDays = cleanSelectedPlan?.days || 30;
        const expires = new Date(now.getTime() + planDays * 24 * 60 * 60 * 1000);
        await User.findByIdAndUpdate(postingUser._id, {
          planStartedAt: now,
          planExpiresAt: expires,
        }).catch(() => {});
      }
    }

    res.status(201).json({
      success: true,
      message: initialStatus === 'approved' ? 'Property posted successfully!' : 'Property submitted for admin review!',
      property,
    });
  } catch (error) {
    console.error('Error posting property:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to post property', error: error.message });
  }
};

// PATCH / PUT /api/properties/:id/plan (Update selected plan for a property)
export const updatePropertyPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { planName, planPrice, planDays } = req.body;

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { $or: [{ _id: id }, { uniqueCode: id }] };

    const property = await Property.findOne(query);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property listing not found' });
    }

    property.selectedPlan = {
      name: planName || property.selectedPlan?.name || 'Free Starter (30 Days)',
      price: planPrice !== undefined ? String(planPrice) : (property.selectedPlan?.price || '₹0'),
      days: Number(planDays) || property.selectedPlan?.days || 30,
      requestedAt: new Date(),
    };

    await property.save();

    res.json({
      success: true,
      message: 'Plan selection updated successfully',
      property,
    });
  } catch (error) {
    console.error('Error updating property plan:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update property plan' });
  }
};
