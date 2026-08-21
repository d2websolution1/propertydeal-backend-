import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const PopupBanner = sequelize.define('PopupBanner', {
  title: { type: DataTypes.STRING, allowNull: false },
  image: { type: DataTypes.STRING, allowNull: false },
  link: { type: DataTypes.STRING, allowNull: true },
  showOnPages: {
    type: DataTypes.JSON,
    defaultValue: ['homepage'],
  },
  delaySeconds: { type: DataTypes.INTEGER, defaultValue: 3 },
  startDate: { type: DataTypes.DATEONLY, allowNull: true },
  endDate: { type: DataTypes.DATEONLY, allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'popupbanners',
  freezeTableName: true,
});

export default PopupBanner;