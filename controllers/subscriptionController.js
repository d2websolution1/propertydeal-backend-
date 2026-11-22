// controllers/subscriptionController.js
import Subscription from '../models/Subscription.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import Enquiry from '../models/Enquiry.js';
import jwt from 'jsonwebtoken';
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

// POST /api/subscriptions/request - Log plan request to Admin Panel (Payment & Enquiry records)
export const requestSubscriptionPlan = async (req, res) => {
  try {
    const { planName, planPrice, userName, userEmail, userPhone, userType, message } = req.body;
    let authUser = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const secrets = [
          process.env.JWT_SECRET,
          'property-adda-secret-key-2025',
          'your-secret-key',
          'secret-key',
        ].filter(Boolean);
        for (const sec of secrets) {
          try {
            const decoded = jwt.verify(token, sec);
            const uid = decoded?.id || decoded?._id || decoded?.userId;
            if (uid) {
              authUser = await User.findById(uid);
              if (authUser) break;
            }
          } catch (jwtErr) {}
        }
      } catch (e) {}
    }

    const resolvedName = authUser?.name || userName || 'Property Adda User';
    const resolvedEmail = (authUser?.email || userEmail || 'user@property-adda.com').toLowerCase().trim();
    const resolvedPhone = authUser?.phone || userPhone || '';
    const resolvedType = authUser?.userType || userType || 'Owner';
    const numPrice = typeof planPrice === 'number'
      ? planPrice
      : Number(String(planPrice || '').replace(/[^\d.]/g, '')) || 0;

    const txId = `REQ-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 1. Create Pending Payment in Admin Billing / Payments
    const payment = await Payment.create({
      transactionId: txId,
      user: authUser?._id || null,
      userName: resolvedName,
      userEmail: resolvedEmail,
      userPhone: resolvedPhone,
      userType: resolvedType,
      plan: planName || 'Subscription Plan',
      amount: numPrice,
      currency: 'INR',
      status: 'pending',
      paymentMethod: 'WhatsApp / Admin Manual',
      notes: `User requested "${planName}" (${numPrice === 0 ? 'Free' : '₹' + numPrice}) via WhatsApp. Awaiting Admin confirmation & payment verification.`,
      paidAt: null,
    });

    // 2. Also log in Enquiry so it appears in Admin Customer Leads / Enquiries
    try {
      await Enquiry.create({
        name: resolvedName,
        email: resolvedEmail,
        phone: resolvedPhone || 'N/A',
        userType: resolvedType,
        source: 'subscription_request',
        message: message || `User requested subscription plan "${planName}" (Price: ${numPrice === 0 ? 'Free' : '₹' + numPrice}). Connect via WhatsApp to verify payment and approve property listings.`,
        status: 'pending',
      });
    } catch (enqErr) {
      console.warn('Note creating Enquiry for plan request:', enqErr.message);
    }

    console.log(`⭐ Logged subscription request for ${resolvedName} (${planName}) in Admin Panel`);

    res.json({
      success: true,
      message: 'Subscription request recorded and sent to Admin Panel successfully.',
      payment,
    });
  } catch (error) {
    console.error('Error in requestSubscriptionPlan:', error);
    res.status(500).json({ success: false, message: 'Failed to record subscription request', error: error.message });
  }
};

