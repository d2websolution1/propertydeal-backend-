// models/Property.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Property = sequelize.define('Property', {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  price: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: false,
  },
  propertyType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  listingType: {
    type: DataTypes.ENUM('sale', 'rent'),
    defaultValue: 'sale',
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  locality: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  bhk: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  areaSqft: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  images: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
  },
  rejectionReason: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isFeatured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  uniqueCode: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true,
  },
  ownerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'properties',
  freezeTableName: true,
});

export default Property;