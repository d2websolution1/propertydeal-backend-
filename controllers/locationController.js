// controllers/locationController.js
import Location from '../models/Location.js';

const DEFAULT_LOCATIONS = [
  {
    city: 'Jaipur',
    state: 'Rajasthan',
    areas: ['Mansarovar', 'Vaishali Nagar', 'Jagatpura', 'Malviya Nagar', 'Tonk Road', 'Ajmer Road', 'C Scheme', 'Raja Park', 'Sanganer', 'Pratap Nagar'],
    isPopular: true,
    order: 1,
  },
  {
    city: 'Delhi NCR',
    state: 'Delhi',
    areas: ['South Delhi', 'Dwarka', 'Rohini', 'Vasant Kunj', 'Saket', 'Janakpuri', 'Connaught Place', 'Laxmi Nagar', 'Pitampura', 'Karol Bagh'],
    isPopular: true,
    order: 2,
  },
  {
    city: 'Noida',
    state: 'Uttar Pradesh',
    areas: ['Sector 62', 'Sector 137', 'Sector 150', 'Sector 75', 'Sector 18', 'Greater Noida West', 'Expressway', 'Sector 128', 'Sector 143'],
    isPopular: true,
    order: 3,
  },
  {
    city: 'Gurgaon',
    state: 'Haryana',
    areas: ['Golf Course Road', 'DLF Phase 1-5', 'Sohna Road', 'Cyber City', 'Sector 57', 'New Gurgaon', 'Dwarka Expressway', 'Sector 82'],
    isPopular: true,
    order: 4,
  },
  {
    city: 'Mumbai',
    state: 'Maharashtra',
    areas: ['Andheri West', 'Bandra West', 'Powai', 'Thane West', 'Borivali West', 'Juhu', 'Navi Mumbai', 'Worli', 'Kandivali East', 'Malad West'],
    isPopular: true,
    order: 5,
  },
  {
    city: 'Bengaluru',
    state: 'Karnataka',
    areas: ['Whitefield', 'Electronic City', 'Indiranagar', 'HSR Layout', 'Koramangala', 'Sarjapur Road', 'Hebbal', 'Marathahalli', 'Bellandur'],
    isPopular: true,
    order: 6,
  },
  {
    city: 'Pune',
    state: 'Maharashtra',
    areas: ['Hinjewadi', 'Wakad', 'Baner', 'Kothrud', 'Kharadi', 'Viman Nagar', 'Hadapsar', 'Magarpatta City', 'Aundh'],
    isPopular: true,
    order: 7,
  },
  {
    city: 'Hyderabad',
    state: 'Telangana',
    areas: ['Gachibowli', 'Hitec City', 'Madhapur', 'Kondapur', 'Jubilee Hills', 'Banjara Hills', 'Kukatpally', 'Manikonda'],
    isPopular: true,
    order: 8,
  },
];

export const getPublicLocations = async (req, res) => {
  try {
    let locations = await Location.find({ status: 'active' }).sort({ order: 1, city: 1 });
    if (!locations || locations.length === 0) {
      // Seed default locations
      locations = await Location.create(DEFAULT_LOCATIONS);
    }

    res.json({
      success: true,
      locations,
      cities: locations.map(l => l.city),
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ message: 'Failed to fetch locations', error: error.message });
  }
};

export const getAllLocationsAdmin = async (req, res) => {
  try {
    let locations = await Location.find().sort({ order: 1, createdAt: -1 });
    if (!locations || locations.length === 0) {
      locations = await Location.create(DEFAULT_LOCATIONS);
    }
    res.json(locations);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch admin locations', error: error.message });
  }
};

export const createLocation = async (req, res) => {
  try {
    const { city, state, areas, isPopular } = req.body;
    if (!city || !city.trim()) {
      return res.status(400).json({ message: 'City name is required' });
    }

    const cleanCity = city.trim();
    const existing = await Location.findOne({ city: { $regex: new RegExp(`^${cleanCity}$`, 'i') } });
    if (existing) {
      return res.status(400).json({ message: `City "${cleanCity}" already exists.` });
    }

    // Process areas
    let areaList = [];
    if (Array.isArray(areas)) {
      areaList = areas.map(a => String(a).trim()).filter(Boolean);
    } else if (typeof areas === 'string') {
      areaList = areas.split(',').map(a => a.trim()).filter(Boolean);
    }

    const newLoc = await Location.create({
      city: cleanCity,
      state: state?.trim() || 'Rajasthan',
      areas: [...new Set(areaList)],
      isPopular: isPopular !== false,
      status: 'active',
      order: 0,
    });

    res.status(201).json(newLoc);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create location', error: error.message });
  }
};

export const updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { city, state, areas, isPopular, status, order } = req.body;

    const loc = await Location.findById(id);
    if (!loc) {
      return res.status(404).json({ message: 'Location not found' });
    }

    if (city) loc.city = city.trim();
    if (state !== undefined) loc.state = state.trim();
    if (isPopular !== undefined) loc.isPopular = isPopular;
    if (status !== undefined) loc.status = status;
    if (order !== undefined) loc.order = Number(order) || 0;

    if (areas !== undefined) {
      let areaList = [];
      if (Array.isArray(areas)) {
        areaList = areas.map(a => String(a).trim()).filter(Boolean);
      } else if (typeof areas === 'string') {
        areaList = areas.split(',').map(a => a.trim()).filter(Boolean);
      }
      loc.areas = [...new Set(areaList)];
    }

    await loc.save();
    res.json(loc);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update location', error: error.message });
  }
};

export const addAreaToCity = async (req, res) => {
  try {
    const { id } = req.params;
    const { area } = req.body;

    if (!area || !area.trim()) {
      return res.status(400).json({ message: 'Area name is required' });
    }

    const loc = await Location.findById(id);
    if (!loc) return res.status(404).json({ message: 'City not found' });

    const cleanArea = area.trim();
    if (!loc.areas.includes(cleanArea)) {
      loc.areas.push(cleanArea);
      await loc.save();
    }

    res.json(loc);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add area', error: error.message });
  }
};

export const deleteLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const loc = await Location.findById(id);
    if (!loc) return res.status(404).json({ message: 'Location not found' });

    await loc.deleteOne();
    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete location', error: error.message });
  }
};

