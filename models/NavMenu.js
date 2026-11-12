// models/NavMenu.js
import mongoose from 'mongoose';
import { applyMongoPlugin } from '../config/mongoPlugin.js';

const navMenuSchema = new mongoose.Schema(
  {
    menuKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    propertyTypes: [
      {
        label: { type: String, required: true },
        path: { type: String, required: true },
        icon: { type: String, default: '🏢' },
      },
    ],
    popularAreas: [{ type: String }],
    searchByBHK: [{ type: String }],
    popularSearches: [{ type: String }],
    isActive: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: 'navmenus',
  }
);

applyMongoPlugin(navMenuSchema);

const NavMenu = mongoose.models.NavMenu || mongoose.model('NavMenu', navMenuSchema);
export default NavMenu;
