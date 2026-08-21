// models/CmsPage.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const CmsPage = sequelize.define('CmsPage', {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  content: {
    type: DataTypes.TEXT,
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
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'cmspages',
  freezeTableName: true,
});

export default CmsPage;