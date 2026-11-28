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
import adminBillingRoutes from './routes/adminBillingRoutes.js';
import locationRoutes from './routes/locationRoutes.js';
import adminLocationRoutes from './routes/adminLocationRoutes.js';
import enquiryRoutes from './routes/enquiryRoutes.js';
import navMenuRoutes from './routes/navMenuRoutes.js';
import adminNavMenuRoutes from './routes/adminNavMenuRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import userRoutes from './routes/userRoutes.js';
import authorityRoutes from './routes/authorityRoutes.js';

dotenv.config();

const app = express();

// ── CORS Config ──
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// ── Serve Frontend Production Build (Single Web App) ──
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicPath = path.join(__dirname, 'public');

app.use(express.static(publicPath));


// ── Core Routes ──
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/properties', adminPropertyRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/admin/reports', adminDashboardRoutes);

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
app.use('/api/admin/enquiries', adminListingRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/admin/payments', adminBillingRoutes);
app.use('/api/admin/subscriptions', adminBillingRoutes);

// ── Locations Management (Cities & Areas) ──
app.use('/api/locations', locationRoutes);
app.use('/api/admin/locations', adminLocationRoutes);

// ── Navigation Menus (Header Dropdowns: Buyers & Tenants) ──
app.use('/api/nav-menus', navMenuRoutes);
app.use('/api/admin/nav-menus', adminNavMenuRoutes);

// ── Subscriptions & User Features ──
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/authorities', authorityRoutes);

// ── Root API Status ──
app.get('/', (req, res) => {
  res.json({ success: true, message: 'PropertyAdda API is live and running perfectly!' });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => console.log(`✅ Server is running on port ${PORT}`));
});