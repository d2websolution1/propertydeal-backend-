// models/Property.js
import mongoose from 'mongoose';
import { applyMongoPlugin } from '../config/mongoPlugin.js';

const propertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  price: {
    type: Number,
    required: true,
  },
  propertyType: {
    type: String,
    required: true,
  },
  listingType: {
    type: String,
    default: 'sale',
  },
  state: {
    type: String,
    default: 'Uttar Pradesh',
  },
  city: {
    type: String,
    required: true,
  },
  locality: {
    type: String,
    default: '',
  },
  projectName: {
    type: String,
    default: '',
  },
  pincode: {
    type: String,
    default: '',
  },
  address: {
    type: String,
    default: '',
  },
  bhk: {
    type: String,
    default: '',
  },
  areaSqft: {
    type: Number,
    default: null,
  },
  bookingAmount: {
    type: Number,
    default: null,
  },
  maintenanceCharges: {
    type: Number,
    default: null,
  },
  isNegotiable: {
    type: Boolean,
    default: false,
  },
  furnishing: {
    type: String,
    default: 'Semi-Furnished',
  },
  amenities: {
    type: [String],
    default: [],
  },
  reraNumber: {
    type: String,
    default: '',
  },
  contactName: {
    type: String,
    default: '',
  },
  contactEmail: {
    type: String,
    default: '',
  },
  contactPhone: {
    type: String,
    default: '',
  },
  ownerName: {
    type: String,
    default: '',
  },
  ownerEmail: {
    type: String,
    default: '',
  },
  ownerPhone: {
    type: String,
    default: '',
  },
  postedByType: {
    type: String,
    enum: ['Owner', 'Dealer / Agent', 'Builder'],
    default: 'Owner',
  },
  whatsappAlerts: {
    type: Boolean,
    default: true,
  },
  qualityScore: {
    type: Number,
    default: 0,
  },
  images: {
    type: [String],
    default: [],
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  rejectionReason: {
    type: String,
    default: null,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  uniqueCode: {
    type: String,
    sparse: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
}, {
  timestamps: true,
  collection: 'properties',
});

// Support ownerId virtual for backward compatibility
propertySchema.virtual('ownerId').get(function () {
  return this.owner ? this.owner.toString() : null;
}).set(function (val) {
  this.owner = val;
});

applyMongoPlugin(propertySchema);

const Property = mongoose.models.Property || mongoose.model('Property', propertySchema);
export default Property;