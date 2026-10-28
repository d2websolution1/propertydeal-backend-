// controllers/adminDashboardController.js
import Property from '../models/Property.js';
import User from '../models/User.js';

function formatTimeAgo(date) {
  const diffSec = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diffSec < 60) return `${Math.max(1, diffSec)}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays} days ago`;
}

export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalClients = await User.countDocuments({ role: 'user' });
    const totalVendors = await User.countDocuments({ role: 'vendor' });

    const totalProperties = await Property.countDocuments();
    const pendingApprovals = await Property.countDocuments({ status: 'pending' });
    const approvedProperties = await Property.countDocuments({ status: 'approved' });
    const featuredProperties = await Property.countDocuments({ isFeatured: true });
    const verifiedProperties = await Property.countDocuments({ isVerified: true });
    const saleProperties = await Property.countDocuments({ listingType: 'sale' });
    const rentProperties = await Property.countDocuments({ listingType: 'rent' });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const newListingsToday = await Property.countDocuments({
      createdAt: { $gte: startOfToday }
    });

    // ── Monthly Trends for Past 6 Months ──
    const now = new Date();
    const listingsTrend = [];
    const userSignups = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthLabel = d.toLocaleString('en-US', { month: 'short' });

      const propCount = await Property.countDocuments({
        createdAt: { $gte: d, $lt: nextD }
      });
      listingsTrend.push({ month: monthLabel, listings: propCount });

      const buyersCount = await User.countDocuments({
        role: 'user',
        createdAt: { $gte: d, $lt: nextD }
      });
      const vendorsCount = await User.countDocuments({
        role: 'vendor',
        createdAt: { $gte: d, $lt: nextD }
      });
      userSignups.push({ month: monthLabel, buyers: buyersCount, vendors: vendorsCount });
    }

    // ── Recent Activity ──
    const recentProperties = await Property.find({})
      .sort({ createdAt: -1 })
      .limit(6)
      .select('title locality city status createdAt listingType');

    const recentUsers = await User.find({})
      .sort({ createdAt: -1 })
      .limit(6)
      .select('name email role createdAt');

    const activityList = [];

    recentProperties.forEach((p) => {
      activityList.push({
        id: `prop_${p._id}`,
        type: p.status === 'approved' ? 'Listing Approved' : (p.status === 'pending' ? 'Pending Approval' : 'New Listing'),
        detail: `${p.title} (${p.city || 'India'})`,
        user: p.listingType === 'rent' ? 'For Rent' : 'For Sale',
        time: p.createdAt ? formatTimeAgo(p.createdAt) : 'Recently',
        timestamp: p.createdAt ? new Date(p.createdAt).getTime() : 0,
      });
    });

    recentUsers.forEach((u) => {
      activityList.push({
        id: `user_${u._id}`,
        type: u.role === 'vendor' ? 'New Vendor' : (u.role === 'admin' ? 'Admin Action' : 'New Client Signup'),
        detail: `${u.name} (${u.email})`,
        user: u.role?.toUpperCase() || 'USER',
        time: u.createdAt ? formatTimeAgo(u.createdAt) : 'Recently',
        timestamp: u.createdAt ? new Date(u.createdAt).getTime() : 0,
      });
    });

    activityList.sort((a, b) => b.timestamp - a.timestamp);

    res.json({
      success: true,
      counts: {
        totalUsers,
        totalClients,
        totalVendors,
        totalProperties,
        pendingApprovals,
        approvedProperties,
        featuredProperties,
        verifiedProperties,
        saleProperties,
        rentProperties,
        newListingsToday,
      },
      listingsTrend,
      userSignups,
      recentActivity: activityList.slice(0, 8),
    });
  } catch (error) {
    console.error('❌ Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard stats', error: error.message });
  }
};
