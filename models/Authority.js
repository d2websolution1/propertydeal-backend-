// models/Authority.js
import mongoose from 'mongoose';
import { applyMongoPlugin } from '../config/mongoPlugin.js';

const authoritySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'authorities',
  }
);

applyMongoPlugin(authoritySchema);

const Authority = mongoose.models.Authority || mongoose.model('Authority', authoritySchema);
export default Authority;
