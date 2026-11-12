// controllers/navMenuController.js
import NavMenu from '../models/NavMenu.js';

export const DEFAULT_NAV_MENUS = [
  {
    menuKey: 'buyers',
    title: 'For Buyers',
    propertyTypes: [
      { label: 'Flats', path: '/?type=apartment', icon: '🏢' },
      { label: 'Houses', path: '/?type=house', icon: '🏠' },
      { label: 'Builder floors', path: '/?type=builder_floor', icon: '🏬' },
      { label: 'Plots', path: '/plots', icon: '🏞️' },
      { label: 'Villas', path: '/?type=villa', icon: '🏡' },
      { label: 'Commercial properties', path: '/commercial', icon: '🏪' },
    ],
    popularAreas: [
      'Thane West',
      'Borivali West',
      'Mira Road East',
      'Kurla West',
      'Kurla East',
      'Santacruz East',
    ],
    searchByBHK: [
      '1 RK for Sale in Mumbai',
      '1 BHK for Sale in Mumbai',
      '2 BHK for Sale in Mumbai',
      '3 BHK for Sale in Mumbai',
      '1 BHK Houses',
      '2 BHK Houses',
    ],
    popularSearches: [
      'Flats without brokerage',
      'Under construction flats',
      'Affordable projects for sale',
      'Ready to move-in projects',
      'New residential projects',
      'Resale properties',
    ],
    isActive: true,
    displayOrder: 1,
  },
  {
    menuKey: 'tenants',
    title: 'For Tenants',
    propertyTypes: [
      { label: 'Flats', path: '/rent?type=apartment', icon: '🏢' },
      { label: 'Houses', path: '/rent?type=house', icon: '🏠' },
      { label: 'PG / Co-living', path: '/pg-co-living', icon: '👥' },
      { label: 'Builder floors', path: '/rent?type=builder_floor', icon: '🏬' },
      { label: 'Villas', path: '/rent?type=villa', icon: '🏡' },
      { label: 'Commercial properties', path: '/commercial', icon: '🏪' },
    ],
    popularAreas: [
      'Thane West',
      'Borivali West',
      'Mira Road East',
      'Kurla West',
      'Kurla East',
      'Santacruz East',
    ],
    searchByBHK: [
      '1 RK for Rent in Mumbai',
      '1 BHK for Rent in Mumbai',
      '2 BHK for Rent in Mumbai',
      '3 BHK for Rent in Mumbai',
      '1 BHK Houses for Rent',
      '2 BHK Houses for Rent',
    ],
    popularSearches: [
      'Flats without brokerage',
      'Fully furnished flats',
      'Bachelor friendly flats',
      'Family friendly flats',
      'Pet friendly flats',
      'Flats near metro',
    ],
    isActive: true,
    displayOrder: 2,
  },
];

// GET /api/nav-menus
export const getPublicNavMenus = async (req, res) => {
  try {
    let menus = await NavMenu.find({ isActive: true }).sort({ displayOrder: 1 });
    if (!menus || menus.length === 0) {
      // Auto seed if empty
      menus = await NavMenu.insertMany(DEFAULT_NAV_MENUS);
    }
    res.json({ success: true, menus });
  } catch (error) {
    console.error('Error fetching public nav menus:', error);
    res.json({ success: true, menus: DEFAULT_NAV_MENUS });
  }
};

// GET /api/nav-menus/:key
export const getPublicNavMenuByKey = async (req, res) => {
  try {
    const menu = await NavMenu.findOne({ menuKey: req.params.key, isActive: true });
    if (!menu) {
      const fallback = DEFAULT_NAV_MENUS.find((m) => m.menuKey === req.params.key);
      return res.json({ success: true, menu: fallback || null });
    }
    res.json({ success: true, menu });
  } catch (error) {
    console.error('Error fetching nav menu by key:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/admin/nav-menus
export const getAllNavMenusAdmin = async (req, res) => {
  try {
    let menus = await NavMenu.find({}).sort({ displayOrder: 1 });
    if (!menus || menus.length === 0) {
      menus = await NavMenu.insertMany(DEFAULT_NAV_MENUS);
    }
    res.json({ success: true, menus });
  } catch (error) {
    console.error('Error fetching admin nav menus:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/admin/nav-menus/:key
export const updateNavMenuAdmin = async (req, res) => {
  try {
    const key = req.params.key;
    const { title, propertyTypes, popularAreas, searchByBHK, popularSearches, isActive } = req.body;

    let menu = await NavMenu.findOne({ menuKey: key });
    if (!menu) {
      menu = new NavMenu({ menuKey: key, title: title || key });
    }

    if (title !== undefined) menu.title = title;
    if (Array.isArray(propertyTypes)) menu.propertyTypes = propertyTypes;
    if (Array.isArray(popularAreas)) menu.popularAreas = popularAreas;
    if (Array.isArray(searchByBHK)) menu.searchByBHK = searchByBHK;
    if (Array.isArray(popularSearches)) menu.popularSearches = popularSearches;
    if (isActive !== undefined) menu.isActive = isActive;

    await menu.save();
    res.json({ success: true, message: `Menu "${menu.title}" updated successfully!`, menu });
  } catch (error) {
    console.error('Error updating nav menu:', error);
    res.status(500).json({ success: false, message: error.message || 'Update failed' });
  }
};

// POST /api/admin/nav-menus/reset
export const resetNavMenusAdmin = async (req, res) => {
  try {
    await NavMenu.deleteMany({});
    const menus = await NavMenu.insertMany(DEFAULT_NAV_MENUS);
    res.json({ success: true, message: 'Navigation menus reset to defaults successfully!', menus });
  } catch (error) {
    console.error('Error resetting nav menus:', error);
    res.status(500).json({ success: false, message: error.message || 'Reset failed' });
  }
};

