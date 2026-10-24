// routes/propertyRoutes.js
import express from 'express';
import {
  getPublicProperties,
  getPropertyById,
  postPublicProperty,
} from '../controllers/propertyController.js';

const router = express.Router();

router.get('/', getPublicProperties);
router.get('/:id', getPropertyById);
router.post('/', postPublicProperty);

export default router;
