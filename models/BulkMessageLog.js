import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const BulkMessageLog = sequelize.define('BulkMessageLog', {
  channel: { type: DataTypes.ENUM('whatsapp', 'sms', 'email'), allowNull: false },
  audience: { type: DataTypes.STRING, allowNull: false }, // 'all', 'owners', 'tenants', 'blocked'
  subject: { type: DataTypes.STRING, allowNull: true }, // email only
  message: { type: DataTypes.TEXT, allowNull: false },
  recipientCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  status: { type: DataTypes.ENUM('pending', 'sent', 'failed'), defaultValue: 'pending' },
});

export default BulkMessageLog;