// controllers/propertyController.js
import Property from '../models/Property.js';
import User from '../models/User.js';
import { Op } from 'sequelize';

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
          attributes: ['id', 'name', 'email', 'phone', 'role'],
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

// GET /api/properties/:id
export const getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;
    const property = await Property.findByPk(id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email', 'phone', 'role'],
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

// POST /api/properties (Public submission / post property matching HomesWale)
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
    } = req.body;

    if (!price || !city) {
      return res.status(400).json({ success: false, message: 'Price and city are required' });
    }

    // Auto generate clear title if left blank
    const autoTitle = title?.trim() || [
      bhk || '',
      propertyType || 'Residential Property',
      projectName ? `in ${projectName}` : '',
      locality ? locality : '',
      city ? city : '',
    ].filter(Boolean).join(' ');

    // Find or link owner
    let ownerId = null;
    if (ownerEmail) {
      let owner = await User.findOne({ where: { email: ownerEmail.toLowerCase().trim() } });
      if (!owner) {
        owner = await User.create({
          name: contactName || ownerName || 'Property Owner',
          email: ownerEmail.toLowerCase().trim(),
          password: 'temp_' + Math.random().toString(36).substring(7),
          phone: ownerPhone || null,
          role: 'user',
        });
      }
      ownerId = owner.id;
    }

    const uniqueCode = 'HW-' + Math.floor(1000 + Math.random() * 9000);

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
      contactName: contactName ? contactName.trim() : '',
      whatsappAlerts: whatsappAlerts !== undefined ? !!whatsappAlerts : true,
      qualityScore: qualityScore ? Number(qualityScore) : 0,
      images: Array.isArray(images) && images.length ? images : [
        'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80'
      ],
      status: 'approved', // auto-approve so it shows on site immediately
      isFeatured: false,
      isVerified: true,
      uniqueCode,
      ownerId,
    });

    res.status(201).json({
      success: true,
      message: 'Property posted successfully!',
      property,
    });
  } catch (error) {
    console.error('Error posting property:', error);
    res.status(500).json({ success: false, message: 'Failed to post property', error: error.message });
  }
};
