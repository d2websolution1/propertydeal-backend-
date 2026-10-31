// controllers/adminBillingController.js
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
export const updatePaymentStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found' });
    }

    if (status) payment.status = status;
    if (notes !== undefined) payment.notes = notes;

    await payment.save();
    res.json({ success: true, payment });
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ success: false, message: error.message || 'Update failed' });
  }
};

// GET /api/admin/subscriptions
export const getAllSubscriptions = async (req, res) => {
  try {
    const plans = await Subscription.find({}).sort({ price: 1 });
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
