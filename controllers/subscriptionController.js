// controllers/subscriptionController.js
import Subscription from '../models/Subscription.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import { sanitizeUser } from './authController.js';

// GET /api/subscriptions/plans - Public list of active subscription plans
export const getPublicPlans = async (req, res) => {
  try {
    const plans = await Subscription.find({ isActive: true }).sort({ price: 1 });
    res.json({
      success: true,
      plans,
    });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({ success: false, message: 'Failed to load subscription plans' });
  }
};

// POST /api/subscriptions/subscribe - User buys or activates a subscription plan
export const subscribePlan = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { planId, paymentMethod = 'Online UPI / NetBanking', transactionId } = req.body;

    if (!planId) {
      return res.status(400).json({ success: false, message: 'Plan ID is required' });
    }

    const plan = await Subscription.findById(planId);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Subscription plan not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const txId = transactionId || `TXN-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const validityDays = plan.validityDays || (plan.billingCycle === 'yearly' ? 270 : plan.billingCycle === 'quarterly' ? 90 : 30);
    const expiresAt = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000);

    // Create payment entry
    const payment = await Payment.create({
      transactionId: txId,
      user: user._id,
      userName: user.name,
      userEmail: user.email,
      userPhone: user.phone || '',
      userType: user.userType || 'Owner',
      plan: plan.name,
      amount: plan.price,
      currency: 'INR',
      status: 'completed',
      paymentMethod,
      billingCycle: plan.billingCycle,
      paidAt: new Date(),
      expiresAt,
      notes: `Subscribed to ${plan.name} (${validityDays} days validity)`,
    });

    // Update user subscription & listing quota
    user.activePlan = plan.name;
    user.listingLimit = Math.max(user.listingLimit || 0, plan.listingLimit || 2);
    user.featuredLimit = (user.featuredLimit || 0) + (plan.featuredLimit || 0);
    user.planExpiresAt = expiresAt;
    await user.save();

    console.log(`✅ User ${user.email} subscribed to ${plan.name} (Limit: ${user.listingLimit} listings)`);

    res.json({
      success: true,
      message: `Successfully activated ${plan.name}! Your listing limit is updated to ${user.listingLimit} listings.`,
      user: sanitizeUser(user),
      payment,
    });
  } catch (error) {
    console.error('Error activating subscription:', error);
    res.status(500).json({ success: false, message: 'Failed to process subscription', error: error.message });
  }
};
