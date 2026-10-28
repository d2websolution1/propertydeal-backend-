// models/HomeSection.js
import mongoose from 'mongoose';
import { applyMongoPlugin } from '../config/mongoPlugin.js';

const homeSectionSchema = new mongoose.Schema({
  sectionKey: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  page: {
    type: String,
    required: true,
    default: 'homepage',
  },
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    default: '',
  },
  items: {
    type: mongoose.Schema.Types.Mixed,
    default: [],
  },
  displayOrder: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
  collection: 'homesections',
});

applyMongoPlugin(homeSectionSchema);

const HomeSection = mongoose.models.HomeSection || mongoose.model('HomeSection', homeSectionSchema);
export default HomeSection;