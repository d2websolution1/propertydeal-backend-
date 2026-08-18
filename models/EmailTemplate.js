import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const EmailTemplate = sequelize.define('EmailTemplate', {
  templateKey: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    // 'welcome', 'otp', 'listing-approved', 'listing-rejected', 'password-reset'
  },
  name: { type: DataTypes.STRING, allowNull: false },
  subject: { type: DataTypes.STRING, allowNull: false },
  body: { type: DataTypes.TEXT, allowNull: false }, // HTML, {{variables}} support
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
});

export default EmailTemplate;