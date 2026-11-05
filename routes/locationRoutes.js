// routes/locationRoutes.js
import express from 'express';
import { getPublicLocations } from '../controllers/locationController.js';

const router = express.Router();

router.get('/', getPublicLocations);

export default router;
