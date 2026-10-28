// models/BulkMessageLog.js
import mongoose from 'mongoose';
import { applyMongoPlugin } from '../config/mongoPlugin.js';

const bulkMessageLogSchema = new mongoose.Schema({
  channel: {
    type: String,
    enum: ['whatsapp', 'sms', 'email'],
    required: true,
  },
  audience: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    default: '',
  },
  message: {
    type: String,
    required: true,
  },
  recipientCount: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending',
  },
}, {
  timestamps: true,
  collection: 'bulkmessagelogs',
});

applyMongoPlugin(bulkMessageLogSchema);

const BulkMessageLog = mongoose.models.BulkMessageLog || mongoose.model('BulkMessageLog', bulkMessageLogSchema);
export default BulkMessageLog;