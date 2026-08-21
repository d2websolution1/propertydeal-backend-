import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const EmailTemplate = sequelize.define('EmailTemplate', {
  templateKey: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  name: { type: DataTypes.STRING, allowNull: false },
  subject: { type: DataTypes.STRING, allowNull: false },
  body: { type: DataTypes.TEXT, allowNull: false },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'emailtemplates',
  freezeTableName: true,
});

export default EmailTemplate;