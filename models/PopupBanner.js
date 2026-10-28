// models/PopupBanner.js
import mongoose from 'mongoose';
import { applyMongoPlugin } from '../config/mongoPlugin.js';

const popupBannerSchema = new mongoose.Schema({
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
  showOnPages: {
    type: [String],
    default: ['homepage'],
  },
  delaySeconds: {
    type: Number,
    default: 3,
  },
  startDate: {
    type: Date,
    default: null,
  },
  endDate: {
    type: Date,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
  collection: 'popupbanners',
});

applyMongoPlugin(popupBannerSchema);

const PopupBanner = mongoose.models.PopupBanner || mongoose.model('PopupBanner', popupBannerSchema);
export default PopupBanner;