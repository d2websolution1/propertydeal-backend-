// routes/adminHomeSectionRoutes.js
import express from 'express';
import { 
  getAllSectionsAdmin,
  createSection,
  updateSection,
  deleteSection,
  addItem,
  updateItem,
  deleteItem,
  getSectionsByPage
} from '../controllers/homeSectionController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// All admin routes are protected
router.use(protect, adminOnly);

// Section routes
router.get('/', getAllSectionsAdmin);
router.get('/page/:page', getSectionsByPage);
router.post('/', createSection);
router.put('/:id', updateSection);
router.delete('/:id', deleteSection);

// Item routes
router.post('/:id/items', addItem);
router.put('/:id/items/:itemId', updateItem);
router.delete('/:id/items/:itemId', deleteItem);

export default router;