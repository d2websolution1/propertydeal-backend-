// controllers/adminListingController.js
import mongoose from 'mongoose';
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
    const enquiries = await Enquiry.find({})
      .sort({ createdAt: -1 })
      .populate('user', 'name email phone')
      .populate('property', 'title locality city price images');
    res.json(enquiries);
  } catch (error) {
    console.error('Error fetching enquiries:', error);
    res.status(500).json({ message: 'Failed to load enquiries', error: error.message });
  }
};

export const createEnquiry = async (req, res) => {
  try {
    const {
      name,
      userName,
      email,
      userEmail,
      phone,
      userPhone,
      propertyId,
      property,
      propertyTitle,
      propertyLocation,
      message,
      note,
    } = req.body;

    const finalName = (name || userName || 'Website Visitor').trim();
    const finalEmail = (email || userEmail || '').trim().toLowerCase();
    const finalPhone = (phone || userPhone || '').trim();
    const finalMessage = (message || note || 'Interested in this property. Please contact me.').trim();

    if (!finalPhone && !finalEmail) {
      return res.status(400).json({ message: 'Phone number or email is required' });
    }

    let resolvedTitle = propertyTitle || '';
    let resolvedLocation = propertyLocation || '';
    const pId = propertyId || property;

    if (pId && mongoose.Types.ObjectId.isValid(pId)) {
      const propDoc = await Property.findById(pId);
      if (propDoc) {
        resolvedTitle = resolvedTitle || propDoc.title;
        resolvedLocation = resolvedLocation || propDoc.locality || propDoc.city;
      }
    }

    const enquiry = await Enquiry.create({
      user: req.user?._id || req.user?.id || null,
      property: pId && mongoose.Types.ObjectId.isValid(pId) ? pId : null,
      propertyTitle: resolvedTitle || 'General Property Inquiry',
      propertyLocation: resolvedLocation || 'India',
      userName: finalName,
      userEmail: finalEmail || (finalPhone ? `${finalPhone.replace(/\D/g, '')}@lead.propertyadda.com` : 'lead@propertyadda.com'),
      userPhone: finalPhone,
      message: finalMessage,
      status: 'new',
    });

    res.status(201).json({
      success: true,
      message: 'Enquiry submitted successfully',
      enquiry,
    });
  } catch (error) {
    console.error('Error in createEnquiry:', error);
    res.status(500).json({ message: 'Failed to submit enquiry', error: error.message });
  }
};

export const updateEnquiryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const id = req.params.id;
    let enquiry = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      enquiry = await Enquiry.findById(id);
    }
    if (!enquiry) {
      enquiry = await Enquiry.findOne({ _id: id });
    }
    
    if (!enquiry) {
      return res.status(404).json({ message: 'Enquiry not found' });
    }

    if (status) enquiry.status = status;
    await enquiry.save();

    res.json({ message: 'Enquiry status updated', enquiry });
  } catch (error) {
    console.error('Error updating enquiry:', error);
    res.status(500).json({ message: 'Failed to update enquiry', error: error.message });
  }
};

export const deleteEnquiry = async (req, res) => {
  try {
    const id = req.params.id;
    let enquiry = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      enquiry = await Enquiry.findByIdAndDelete(id);
    }
    if (!enquiry) {
      enquiry = await Enquiry.findOneAndDelete({ _id: id });
    }
    if (!enquiry) {
      return res.status(404).json({ message: 'Enquiry not found' });
    }

    res.json({ message: 'Enquiry deleted successfully' });
  } catch (error) {
    console.error('Error deleting enquiry:', error);
    res.status(500).json({ message: 'Failed to delete enquiry', error: error.message });
  }
};