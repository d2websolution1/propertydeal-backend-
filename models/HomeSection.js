// models/HomeSection.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const HomeSection = sequelize.define('HomeSection', {
  sectionKey: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  page: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'homepage',
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  subtitle: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  items: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  displayOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'homesections',
  freezeTableName: true,
});

export default HomeSection;