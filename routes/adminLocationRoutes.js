// routes/adminLocationRoutes.js
import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import {
  getAllLocationsAdmin,
  createLocation,
  updateLocation,
  addAreaToCity,
  addTownshipToCity,
  addSubAreaToCity,
  deleteLocation,
} from '../controllers/locationController.js';

const router = express.Router();

router.use(protect, adminOnly);

router.get('/', getAllLocationsAdmin);
router.post('/', createLocation);
router.put('/:id', updateLocation);
router.post('/:id/areas', addAreaToCity);
router.post('/:id/townships', addTownshipToCity);
router.post('/:id/subareas', addSubAreaToCity);
router.delete('/:id', deleteLocation);

export default router;

