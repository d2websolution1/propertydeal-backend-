// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';

// Models
import User from './models/User.js';
import Property from './models/Property.js';
import HomeSection from './models/HomeSection.js';
import BlogPost from './models/BlogPost.js';
import SeoSetting from './models/SeoSetting.js';
import Advertisement from './models/Advertisement.js';
import CmsPage from './models/CmsPage.js';
import EmailTemplate from './models/EmailTemplate.js';
import PopupBanner from './models/PopupBanner.js';
import BulkMessageLog from './models/BulkMessageLog.js';
// server.js - Add new routes
import adminListingRoutes from './routes/adminListingRoutes.js';
import adminDashboardRoutes from './routes/adminDashboardRoutes.js';

// ... existing routes ...


// Routes
import authRoutes from './routes/authRoutes.js';
import propertyRoutes from './routes/propertyRoutes.js';
import adminUserRoutes from './routes/adminUserRoutes.js';
import adminPropertyRoutes from './routes/adminPropertyRoutes.js';

import homeSectionRoutes from './routes/homeSectionRoutes.js';
import adminHomeSectionRoutes from './routes/adminHomeSectionRoutes.js';

import blogRoutes from './routes/blogRoutes.js';
import adminBlogRoutes from './routes/adminBlogRoutes.js';

import seoRoutes from './routes/seoRoutes.js';
import adminSeoRoutes from './routes/adminSeoRoutes.js';

import advertisementRoutes from './routes/advertisementRoutes.js';
import adminAdvertisementRoutes from './routes/adminAdvertisementRoutes.js';

import cmsRoutes from './routes/cmsRoutes.js';
import adminCmsRoutes from './routes/adminCmsRoutes.js';

import adminEmailTemplateRoutes from './routes/adminEmailTemplateRoutes.js';

import bannerRoutes from './routes/bannerRoutes.js';
import adminBannerRoutes from './routes/adminBannerRoutes.js';

import adminBulkMessageRoutes from './routes/adminBulkMessageRoutes.js';

dotenv.config();

const app = express();

// ── CORS Config ──
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (/^http:\/\/localhost(:\d+)?$/.test(origin) || /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin) || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Allow any Vercel deployment (preview or production)
    if (/^https:\/\/.*\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

app.get('/', (req, res) => {
  res.send('API is running...');
});

// ── Core Routes ──
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/properties', adminPropertyRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);

// ── Homepage / Rent / other pages content ──
app.use('/api/home-sections', homeSectionRoutes);
app.use('/api/admin/home-sections', adminHomeSectionRoutes);

// ── Blog Management ──
app.use('/api/blogs', blogRoutes);
app.use('/api/admin/blogs', adminBlogRoutes);

// ── SEO Settings ──
app.use('/api/seo', seoRoutes);
app.use('/api/admin/seo', adminSeoRoutes);

// ── Advertisements ──
app.use('/api/ads', advertisementRoutes);
app.use('/api/admin/ads', adminAdvertisementRoutes);

// ── CMS Pages ──
app.use('/api/cms', cmsRoutes);
app.use('/api/admin/cms', adminCmsRoutes);

// ── Email Templates (admin only, no public route) ──
app.use('/api/admin/email-templates', adminEmailTemplateRoutes);

// ── Pop-up Banners ──
app.use('/api/banners', bannerRoutes);
app.use('/api/admin/banners', adminBannerRoutes);

// ── Bulk WhatsApp / SMS / Email (admin only) ──
app.use('/api/admin/bulk-messaging', adminBulkMessageRoutes);
app.use('/api/admin/listings', adminListingRoutes);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`✅ Server is running at http://localhost:${PORT}`));
});