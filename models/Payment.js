// models/Payment.js
import mongoose from 'mongoose';
import { applyMongoPlugin } from '../config/mongoPlugin.js';

const paymentSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    userEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    userPhone: {
      type: String,
      default: '',
    },
    userType: {
      type: String,
      enum: ['Owner', 'Dealer / Agent', 'Builder', 'Client', 'Buyer'],
      default: 'Owner',
    },
    plan: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['completed', 'pending', 'failed', 'refunded'],
      default: 'completed',
    },
    paymentMethod: {
      type: String,
      enum: ['UPI', 'Razorpay', 'Card', 'NetBanking', 'Offline / Cash'],
      default: 'UPI',
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      default: null,
    },
    propertyTitle: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    collection: 'payments',
  }
);

applyMongoPlugin(paymentSchema);

const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);

export default Payment;
