// models/SeoSetting.js
import mongoose from 'mongoose';
import { applyMongoPlugin } from '../config/mongoPlugin.js';

const seoSettingSchema = new mongoose.Schema({
  pageKey: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  pageLabel: {
    type: String,
    required: true,
  },
  metaTitle: {
    type: String,
    default: '',
  },
  metaDescription: {
    type: String,
    default: '',
  },
  metaKeywords: {
    type: String,
    default: '',
  },
  ogImage: {
    type: String,
    default: '',
  },
  canonicalUrl: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
  collection: 'seosettings',
});

applyMongoPlugin(seoSettingSchema);

const SeoSetting = mongoose.models.SeoSetting || mongoose.model('SeoSetting', seoSettingSchema);
export default SeoSetting;