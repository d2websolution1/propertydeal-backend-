// models/CmsPage.js
import mongoose from 'mongoose';
import { applyMongoPlugin } from '../config/mongoPlugin.js';

const cmsPageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  content: {
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
  isPublished: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
  collection: 'cmspages',
});

applyMongoPlugin(cmsPageSchema);

const CmsPage = mongoose.models.CmsPage || mongoose.model('CmsPage', cmsPageSchema);
export default CmsPage;