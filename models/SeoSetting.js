// models/SeoSetting.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

// Har page (homepage, rent, buy, commercial, plots, pg, blog, etc.) ki
// apni meta settings — ek row = ek page ka SEO data
const SeoSetting = sequelize.define('SeoSetting', {
  pageKey: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    // 'homepage', 'rent', 'buy', 'commercial', 'plots', 'pg', 'blog'
  },
  pageLabel: {
    type: DataTypes.STRING,
    allowNull: false,
    // display name, e.g. "Homepage", "Rent Page"
  },
  metaTitle: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  metaDescription: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  metaKeywords: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  ogImage: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  canonicalUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

export default SeoSetting;