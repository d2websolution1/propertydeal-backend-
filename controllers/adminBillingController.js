// controllers/adminBillingController.js
import mongoose from 'mongoose';
import Payment from '../models/Payment.js';
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';

// GET /api/admin/payments
export const getAllPayments = async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { transactionId: { $regex: search, $options: 'i' } },
        { userName: { $regex: search, $options: 'i' } },
        { userEmail: { $regex: search, $options: 'i' } },
        { plan: { $regex: search, $options: 'i' } },
      ];
    }

    const payments = await Payment.find(filter).sort({ createdAt: -1 });

    // Compute real-time aggregates directly from database documents
    const allRecords = await Payment.find({});
    const totalRevenue = allRecords
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const completedAmount = totalRevenue;
    const pendingAmount = allRecords
      .filter((p) => p.status === 'pending')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const refundedAmount = allRecords
      .filter((p) => p.status === 'refunded')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const counts = {
      all: allRecords.length,
      completed: allRecords.filter((p) => p.status === 'completed').length,
      pending: allRecords.filter((p) => p.status === 'pending').length,
      failed: allRecords.filter((p) => p.status === 'failed').length,
      refunded: allRecords.filter((p) => p.status === 'refunded').length,
    };

    res.json({
      success: true,
      payments,
      summary: {
        totalRevenue,
        completedAmount,
        pendingAmount,
        refundedAmount,
        counts,
      },
    });
  } catch (error) {
    console.error('Error in getAllPayments:', error);
    res.status(500).json({ success: false, message: 'Server error loading payments' });
  }
};

// POST /api/admin/payments
export const createPayment = async (req, res) => {
  try {
    const {
      transactionId,
      userName,
      userEmail,
      userPhone,
      userType,
      plan,
      amount,
      status,
      paymentMethod,
      notes,
    } = req.body;

    if (!userName || !userEmail || !plan || amount === undefined) {
      return res.status(400).json({ message: 'Missing required payment fields' });
    }

    const txId = transactionId || `PAY-IND-${Math.floor(100000 + Math.random() * 900000)}`;

    // Try finding linked user
    let userObj = await User.findOne({ email: userEmail.toLowerCase().trim() });

    const payment = await Payment.create({
      transactionId: txId,
      user: userObj?._id || null,
      userName: userName.trim(),
      userEmail: userEmail.toLowerCase().trim(),
      userPhone: userPhone || userObj?.phone || '',
      userType: userType || userObj?.userType || 'Owner',
      plan: plan.trim(),
      amount: Number(amount),
      status: status || 'completed',
      paymentMethod: paymentMethod || 'UPI',
      notes: notes || '',
    });

    res.status(201).json({ success: true, payment });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ success: false, message: error.message || 'Payment creation failed' });
  }
};

// PUT /api/admin/payments/:id
export const updatePayment = async (req, res) => {
  try {
    const {
      transactionId,
      userName,
      userEmail,
      userPhone,
      userType,
      plan,
      amount,
      status,
      paymentMethod,
      notes,
    } = req.body;

    const id = req.params.id;
    let payment = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      payment = await Payment.findById(id);
    }
    if (!payment) {
      payment = await Payment.findOne({ transactionId: id });
    }

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    if (transactionId) payment.transactionId = transactionId.trim();
    if (userName) payment.userName = userName.trim();
    if (userEmail) payment.userEmail = userEmail.toLowerCase().trim();
    if (userPhone !== undefined) payment.userPhone = userPhone.trim();
    if (userType) payment.userType = userType;
    if (plan) payment.plan = plan.trim();
    if (amount !== undefined && amount !== null && amount !== '') payment.amount = Number(amount);
    if (status) payment.status = status;
    if (paymentMethod) payment.paymentMethod = paymentMethod;
    if (notes !== undefined) payment.notes = notes;

    await payment.save();

    // If payment is completed, auto-activate plan for user
    if (payment.status === 'completed' && payment.userEmail) {
      try {
        const u = await User.findOne({ email: payment.userEmail.toLowerCase().trim() });
        if (u) {
          const planStr = (payment.plan || '').toLowerCase();
          let limit = u.listingLimit || 2;
          let days = 30;
          let featured = 0;
          if (planStr.includes('gold') || planStr.includes('499')) {
            limit = Math.max(limit, 5);
            days = 60;
            featured = 1;
          } else if (planStr.includes('annual owner') || planStr.includes('1499')) {
            limit = Math.max(limit, 20);
            days = 365;
            featured = 5;
          } else if (planStr.includes('pro agent') || planStr.includes('1999')) {
            limit = Math.max(limit, 50);
            days = 90;
            featured = 5;
          } else if (planStr.includes('standard agent') || planStr.includes('999')) {
            limit = Math.max(limit, 20);
            days = 45;
            featured = 2;
          } else if (planStr.includes('annual agent') || planStr.includes('4999')) {
            limit = Math.max(limit, 200);
            days = 365;
            featured = 20;
          }
          u.activePlan = payment.plan || u.activePlan;
          u.listingLimit = limit;
          u.featuredLimit = (u.featuredLimit || 0) + featured;
          u.planExpiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
          await u.save();
          console.log(`✅ Activated plan "${u.activePlan}" for ${u.email} on payment completion`);
        }
      } catch (userErr) {
        console.warn('Could not auto-activate user on payment completion:', userErr.message);
      }
    }

    res.json({ success: true, payment, message: 'Payment updated successfully' });
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ success: false, message: error.message || 'Update failed' });
  }
};

export const updatePaymentStatus = updatePayment;

// DELETE /api/admin/payments/:id
export const deletePayment = async (req, res) => {
  try {
    const id = req.params.id;
    let payment = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      payment = await Payment.findByIdAndDelete(id);
    }
    if (!payment) {
      payment = await Payment.findOneAndDelete({ transactionId: id });
    }

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }
    res.json({ success: true, message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ success: false, message: error.message || 'Delete failed' });
  }
};

// Standard subscription packages matching client pricing specifications
export const STANDARD_SUBSCRIPTION_PLANS = [
  {
    name: 'Free Starter (30 Days)',
    tier: 'free',
    targetAudience: 'Owner',
    price: 0,
    billingCycle: 'one-time',
    listingLimit: 2,
    featuredLimit: 0,
    validityDays: 30,
    features: [
      'Post up to 2 Properties Free',
      '30 Days Listing Validity',
      'Direct Buyer Phone & WhatsApp Inquiries',
      'Standard Search Placement',
    ],
    badge: 'FREE',
    isActive: true,
  },
  {
    name: 'Gold Owner Plan (60 Days)',
    tier: 'silver',
    targetAudience: 'Owner',
    price: 499,
    billingCycle: 'monthly',
    listingLimit: 5,
    featuredLimit: 1,
    validityDays: 60,
    features: [
      'Post up to 5 Properties',
      '60 Days Extended Validity',
      'Verified Green Shield Owner Badge',
      'Top 5 in Search Results Boost',
      'Instant WhatsApp Inquiries Alert',
    ],
    badge: 'POPULAR',
    isActive: true,
  },
  {
    name: 'Annual Owner Plan (365 Days)',
    tier: 'gold',
    targetAudience: 'Owner',
    price: 1499,
    billingCycle: 'yearly',
    listingLimit: 20,
    featuredLimit: 5,
    validityDays: 365,
    features: [
      'Post up to 20 Properties',
      '365 Days Full Year Validity',
      'Gold Verified Owner Badge',
      '5 Featured Boost Slots',
      'Priority WhatsApp & Phone Leads',
      'Dedicated Support',
    ],
    badge: 'BEST VALUE',
    isActive: true,
  },
  {
    name: 'Standard Agent Plan (45 Days)',
    tier: 'platinum',
    targetAudience: 'Dealer / Agent',
    price: 999,
    billingCycle: 'monthly',
    listingLimit: 20,
    featuredLimit: 2,
    validityDays: 45,
    features: [
      'Up to 20 Active Listings',
      '45 Days Validity',
      '2 Featured Boost Slots',
      'Verified Agent Badge',
      'Direct Client & WhatsApp Enquiries',
    ],
    badge: 'AGENT PACK',
    isActive: true,
  },
];

// GET /api/admin/subscriptions
export const getAllSubscriptions = async (req, res) => {
  try {
    let plans = await Subscription.find({}).sort({ price: 1 });

    // If plans are missing or contain old template names, synchronize standard plans
    const hasGold499 = plans.some((p) => p.name?.includes('499') || p.name?.includes('Gold'));
    if (!plans || plans.length === 0 || !hasGold499) {
      for (const sp of STANDARD_SUBSCRIPTION_PLANS) {
        await Subscription.findOneAndUpdate(
          { name: sp.name },
          { $set: sp },
          { upsert: true, new: true }
        );
      }
      plans = await Subscription.find({}).sort({ price: 1 });
    }

    res.json(plans);
  } catch (error) {
    console.error('Error loading subscriptions:', error);
    res.status(500).json({ message: 'Server error loading subscriptions' });
  }
};

// POST /api/admin/subscriptions
export const createSubscription = async (req, res) => {
  try {
    const plan = await Subscription.create(req.body);
    res.status(201).json({ success: true, plan });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ message: error.message || 'Failed to create subscription' });
  }
};

// PUT /api/admin/subscriptions/:id
export const updateSubscription = async (req, res) => {
  try {
    const plan = await Subscription.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!plan) return res.status(404).json({ message: 'Subscription not found' });
    res.json({ success: true, plan });
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ message: error.message || 'Failed to update subscription' });
  }
};
