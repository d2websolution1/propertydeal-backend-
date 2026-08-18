// controllers/adminListingController.js
import Property from '../models/Property.js';
import User from '../models/User.js';
import Enquiry from '../models/Enquiry.js';
import { Op } from 'sequelize';

// ───────────────────────────────
// FEATURED LISTINGS
// ───────────────────────────────

export const getFeaturedListings = async (req, res) => {
  try {
    const properties = await Property.findAll({
      where: { isFeatured: true },
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['updatedAt', 'DESC']]
    });
    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load featured listings', error: error.message });
  }
};

export const toggleFeatured = async (req, res) => {
  try {
    const property = await Property.findByPk(req.params.id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    property.isFeatured = !property.isFeatured;
    await property.save();

    res.json({ 
      message: property.isFeatured ? 'Property added to featured' : 'Property removed from featured',
      property 
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to toggle featured', error: error.message });
  }
};

export const removeFeatured = async (req, res) => {
  try {
    const property = await Property.findByPk(req.params.id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    property.isFeatured = false;
    await property.save();

    res.json({ message: 'Property removed from featured listings' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove featured', error: error.message });
  }
};

// ───────────────────────────────
// VERIFIED PROPERTY TAGS
// ───────────────────────────────

export const getVerifiedProperties = async (req, res) => {
  try {
    const properties = await Property.findAll({
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['isVerified', 'DESC'], ['updatedAt', 'DESC']]
    });
    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load properties', error: error.message });
  }
};

export const toggleVerified = async (req, res) => {
  try {
    const property = await Property.findByPk(req.params.id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    property.isVerified = !property.isVerified;
    await property.save();

    res.json({ 
      message: property.isVerified ? 'Property verified' : 'Verification removed',
      property 
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to toggle verification', error: error.message });
  }
};

// ───────────────────────────────
// ENQUIRIES
// ───────────────────────────────

export const getEnquiries = async (req, res) => {
  try {
    const enquiries = await Enquiry.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: Property,
          as: 'property',
          attributes: ['id', 'title', 'location', 'price']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(enquiries);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load enquiries', error: error.message });
  }
};

export const updateEnquiryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const enquiry = await Enquiry.findByPk(req.params.id);
    
    if (!enquiry) {
      return res.status(404).json({ message: 'Enquiry not found' });
    }

    enquiry.status = status;
    await enquiry.save();

    res.json({ message: 'Enquiry status updated', enquiry });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update enquiry', error: error.message });
  }
};

export const deleteEnquiry = async (req, res) => {
  try {
    const enquiry = await Enquiry.findByPk(req.params.id);
    if (!enquiry) {
      return res.status(404).json({ message: 'Enquiry not found' });
    }

    await enquiry.destroy();
    res.json({ message: 'Enquiry deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete enquiry', error: error.message });
  }
};