// models/SeoSetting.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const SeoSetting = sequelize.define('SeoSetting', {
  pageKey: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  pageLabel: {
    type: DataTypes.STRING,
    allowNull: false,
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
}, {
  tableName: 'seosettings',
  freezeTableName: true,
});

export default SeoSetting;