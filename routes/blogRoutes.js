// routes/blogRoutes.js
import express from 'express';
import { getPublicBlogs, getPublicBlogBySlug } from '../controllers/blogController.js';

const router = express.Router();

router.get('/', getPublicBlogs);
router.get('/:slug', getPublicBlogBySlug);

export default router;