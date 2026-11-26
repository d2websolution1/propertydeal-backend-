// controllers/locationController.js
import Location from '../models/Location.js';

const DEFAULT_TOWNSHIPS = [
  'Mahima Panorama',
  'Mahima Florenza',
  'Vatika Infotech City',
  'Ashiana Town',
  'Omaxe City',
  'Manglam Grand City',
  'UDB Greens',
  'Unique Sapphire',
  'Green Meadows',
  'Siddhi Homes',
  'Trimurty Ariana',
];

const DEFAULT_SUBAREAS = [
  'Block A',
  'Block B',
  'Block C',
  'Phase 1',
  'Phase 2',
  'Extension',
  'Main Road Facing',
  'Near Metro Station',
  'Sector 62',
  'Sector 18 Pocket 2',
];

const DEFAULT_LOCATIONS = [
  {
    city: 'Jaipur',
    state: 'Rajasthan',
    areas: [
      'Agra Road',
      'Ajmer Road',
      'Banipark',
      'Civil Lines',
      'Diggi Road',
      'Gopalpura',
      'Jagatpura',
      'Jhotwara',
      'Mansarovar',
      'Vaishali Nagar',
      'Malviya Nagar',
      'Tonk Road',
      'C Scheme',
      'Raja Park',
      'Sanganer',
      'Pratap Nagar',
      'Kalwar Road',
      'Sirsi Road',
      'Sikar Road',
    ],
    townships: DEFAULT_TOWNSHIPS,
    subAreas: DEFAULT_SUBAREAS,
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
    const { city, state, areas, townships, subAreas, isPopular } = req.body;
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

    // Process townships
    let townshipList = [];
    if (Array.isArray(townships)) {
      townshipList = townships.map(t => String(t).trim()).filter(Boolean);
    } else if (typeof townships === 'string') {
      townshipList = townships.split(',').map(t => t.trim()).filter(Boolean);
    } else {
      townshipList = [...DEFAULT_TOWNSHIPS];
    }

    // Process subAreas
    let subAreaList = [];
    if (Array.isArray(subAreas)) {
      subAreaList = subAreas.map(s => String(s).trim()).filter(Boolean);
    } else if (typeof subAreas === 'string') {
      subAreaList = subAreas.split(',').map(s => s.trim()).filter(Boolean);
    } else {
      subAreaList = [...DEFAULT_SUBAREAS];
    }

    const newLoc = await Location.create({
      city: cleanCity,
      state: state?.trim() || 'Rajasthan',
      areas: [...new Set(areaList)],
      townships: [...new Set(townshipList)],
      subAreas: [...new Set(subAreaList)],
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
    const { city, state, areas, townships, subAreas, isPopular, status, order } = req.body;

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

    if (townships !== undefined) {
      let tList = [];
      if (Array.isArray(townships)) {
        tList = townships.map(t => String(t).trim()).filter(Boolean);
      } else if (typeof townships === 'string') {
        tList = townships.split(',').map(t => t.trim()).filter(Boolean);
      }
      loc.townships = [...new Set(tList)];
    }

    if (subAreas !== undefined) {
      let sList = [];
      if (Array.isArray(subAreas)) {
        sList = subAreas.map(s => String(s).trim()).filter(Boolean);
      } else if (typeof subAreas === 'string') {
        sList = subAreas.split(',').map(s => s.trim()).filter(Boolean);
      }
      loc.subAreas = [...new Set(sList)];
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

export const addTownshipToCity = async (req, res) => {
  try {
    const { id } = req.params;
    const { township } = req.body;

    if (!township || !township.trim()) {
      return res.status(400).json({ message: 'Township name is required' });
    }

    const loc = await Location.findById(id);
    if (!loc) return res.status(404).json({ message: 'City not found' });

    const cleanTownship = township.trim();
    if (!Array.isArray(loc.townships)) loc.townships = [];
    if (!loc.townships.includes(cleanTownship)) {
      loc.townships.push(cleanTownship);
      await loc.save();
    }

    res.json(loc);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add township', error: error.message });
  }
};

export const addSubAreaToCity = async (req, res) => {
  try {
    const { id } = req.params;
    const { subArea } = req.body;

    if (!subArea || !subArea.trim()) {
      return res.status(400).json({ message: 'Sub-area name is required' });
    }

    const loc = await Location.findById(id);
    if (!loc) return res.status(404).json({ message: 'City not found' });

    const cleanSubArea = subArea.trim();
    if (!Array.isArray(loc.subAreas)) loc.subAreas = [];
    if (!loc.subAreas.includes(cleanSubArea)) {
      loc.subAreas.push(cleanSubArea);
      await loc.save();
    }

    res.json(loc);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add sub-area', error: error.message });
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

