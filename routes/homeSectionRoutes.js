// routes/homeSectionRoutes.js
import express from 'express';
import {
  getPublicSections,
  getPublicSectionByKey,
  getAllSectionsAdmin,
  getSectionsByPage,
  createSection,
  updateSection,
  deleteSection,
  addItem,
  updateItem,
  deleteItem
} from '../controllers/homeSectionController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// ───────────────────────────────
// PUBLIC ROUTES
// ───────────────────────────────
router.get('/', getPublicSections);
router.get('/page/:page', getSectionsByPage);
router.get('/:key', getPublicSectionByKey);

// ───────────────────────────────
// ADMIN ROUTES (Protected)
// ───────────────────────────────
router.get('/admin/home-sections', protect, adminOnly, getAllSectionsAdmin);
router.get('/admin/home-sections/page/:page', protect, adminOnly, getSectionsByPage);
router.post('/admin/home-sections', protect, adminOnly, createSection);
router.put('/admin/home-sections/:id', protect, adminOnly, updateSection);
router.delete('/admin/home-sections/:id', protect, adminOnly, deleteSection);

// Item routes
router.post('/admin/home-sections/:id/items', protect, adminOnly, addItem);
router.put('/admin/home-sections/:id/items/:itemId', protect, adminOnly, updateItem);
router.delete('/admin/home-sections/:id/items/:itemId', protect, adminOnly, deleteItem);

export default router;