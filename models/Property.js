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
    enum: ['sale', 'rent'],
    default: 'sale',
  },
  city: {
    type: String,
    required: true,
  },
  locality: {
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