import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Advertisement = sequelize.define('Advertisement', {
  title: { type: DataTypes.STRING, allowNull: false },
  image: { type: DataTypes.STRING, allowNull: false },
  link: { type: DataTypes.STRING, allowNull: true },
  position: {
    type: DataTypes.ENUM('header', 'sidebar', 'footer', 'between-listings'),
    defaultValue: 'sidebar',
  },
  startDate: { type: DataTypes.DATEONLY, allowNull: true },
  endDate: { type: DataTypes.DATEONLY, allowNull: true },
  clicks: { type: DataTypes.INTEGER, defaultValue: 0 },
  impressions: { type: DataTypes.INTEGER, defaultValue: 0 },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
});

export default Advertisement;