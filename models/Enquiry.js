// models/Enquiry.js
import mongoose from 'mongoose';
import { applyMongoPlugin } from '../config/mongoPlugin.js';

const enquirySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: false,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
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
    enum: ['Owner', 'Dealer / Agent', 'Builder', 'Admin', 'User'],
    default: 'Owner',
  },
  message: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'in_progress', 'closed'],
    default: 'new',
  },
  userName: {
    type: String,
    required: true,
  },
  userEmail: {
    type: String,
    required: true,
  },
  userPhone: {
    type: String,
    default: null,
  },
  propertyTitle: {
    type: String,
    required: true,
  },
  propertyLocation: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
  collection: 'enquiries',
});

enquirySchema.virtual('userId').get(function () {
  return this.user ? this.user.toString() : null;
}).set(function (val) {
  this.user = val;
});

enquirySchema.virtual('propertyId').get(function () {
  return this.property ? this.property.toString() : null;
}).set(function (val) {
  this.property = val;
});

enquirySchema.virtual('ownerId').get(function () {
  return this.owner ? this.owner.toString() : null;
}).set(function (val) {
  this.owner = val;
});

applyMongoPlugin(enquirySchema);

const Enquiry = mongoose.models.Enquiry || mongoose.model('Enquiry', enquirySchema);
export default Enquiry;