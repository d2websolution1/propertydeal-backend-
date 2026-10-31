// models/Subscription.js
import mongoose from 'mongoose';
import { applyMongoPlugin } from '../config/mongoPlugin.js';

const subscriptionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    tier: {
      type: String,
      enum: ['free', 'silver', 'gold', 'platinum', 'enterprise'],
      default: 'silver',
    },
    targetAudience: {
      type: String,
      enum: ['Owner', 'Dealer / Agent', 'Builder', 'All'],
      default: 'All',
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    billingCycle: {
      type: String,
      enum: ['one-time', 'monthly', 'quarterly', 'yearly'],
      default: 'monthly',
    },
    listingLimit: {
      type: Number,
      default: 5,
    },
    featuredLimit: {
      type: Number,
      default: 1,
    },
    features: {
      type: [String],
      default: [],
    },
    badge: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'subscriptions',
  }
);

applyMongoPlugin(subscriptionSchema);

const Subscription = mongoose.models.Subscription || mongoose.model('Subscription', subscriptionSchema);

export default Subscription;
