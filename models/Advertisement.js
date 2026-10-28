// models/Advertisement.js
import mongoose from 'mongoose';
import { applyMongoPlugin } from '../config/mongoPlugin.js';

const advertisementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  image: {
    type: String,
    required: true,
  },
  link: {
    type: String,
    default: '',
  },
  position: {
    type: String,
    enum: ['header', 'sidebar', 'footer', 'between-listings'],
    default: 'sidebar',
  },
  startDate: {
    type: Date,
    default: null,
  },
  endDate: {
    type: Date,
    default: null,
  },
  clicks: {
    type: Number,
    default: 0,
  },
  impressions: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
  collection: 'advertisements',
});

applyMongoPlugin(advertisementSchema);

const Advertisement = mongoose.models.Advertisement || mongoose.model('Advertisement', advertisementSchema);
export default Advertisement;