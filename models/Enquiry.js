// models/Enquiry.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Enquiry = sequelize.define('Enquiry', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  propertyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'properties',
      key: 'id'
    }
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('new', 'contacted', 'in_progress', 'closed'),
    defaultValue: 'new'
  },
  userName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  userEmail: {
    type: DataTypes.STRING,
    allowNull: false
  },
  userPhone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  propertyTitle: {
    type: DataTypes.STRING,
    allowNull: false
  },
  propertyLocation: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'enquiries',
  freezeTableName: true,
  timestamps: true
});

export default Enquiry;