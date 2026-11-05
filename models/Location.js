// models/Location.js
import mongoose from 'mongoose';
import { applyMongoPlugin } from '../config/mongoPlugin.js';

const locationSchema = new mongoose.Schema({
  city: {
    type: String,
    required: true,
    trim: true,
  },
  state: {
    type: String,
    default: 'Rajasthan',
    trim: true,
  },
  areas: {
    type: [String],
    default: [],
  },
  isPopular: {
    type: Boolean,
    default: true,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  order: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
  collection: 'locations',
});

applyMongoPlugin(locationSchema);

const Location = mongoose.models.Location || mongoose.model('Location', locationSchema);
export default Location;

