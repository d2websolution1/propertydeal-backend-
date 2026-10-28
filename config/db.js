// config/db.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

// Pre-load all models
import User from '../models/User.js';
import Property from '../models/Property.js';
import HomeSection from '../models/HomeSection.js';
import BlogPost from '../models/BlogPost.js';
import SeoSetting from '../models/SeoSetting.js';
import Advertisement from '../models/Advertisement.js';
import CmsPage from '../models/CmsPage.js';
import EmailTemplate from '../models/EmailTemplate.js';
import PopupBanner from '../models/PopupBanner.js';
import BulkMessageLog from '../models/BulkMessageLog.js';
import Enquiry from '../models/Enquiry.js';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL;

const connectDB = async () => {
  if (!mongoUri || (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://'))) {
    console.warn('\n⚠️ [MONGODB CONFIGURATION REQUIRED]');
    console.warn('👉 Please set MONGODB_URI in your environment variables (.env or Render Dashboard).');
    console.warn('   Example: mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/propertylisting?retryWrites=true&w=majority\n');
    return;
  }

  try {
    console.log(`📦 Connecting to MongoDB Atlas...`);
    const conn = await mongoose.connect(mongoUri);
    console.log(`✅ MongoDB Atlas connected successfully: ${conn.connection.host} (DB: ${conn.connection.name})`);

    // Run auto-seeder to guarantee Admin and sample properties exist
    await seedInitialData();
  } catch (error) {
    console.error('❌ MongoDB Atlas connection error:', error.message);
  }
};

async function seedInitialData() {
  try {
    // 1. Ensure PropertyDeal Admin exists
    const primaryAdminEmail = 'admin@propertydeal.com';
    let admin = await User.findOne({ email: primaryAdminEmail });
    if (!admin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      admin = await User.create({
        name: 'PropertyDeal Admin',
        email: primaryAdminEmail,
        password: hashedPassword,
        role: 'admin',
        phone: '+91 9876543210',
        isBlocked: false,
      });
      console.log(`⭐ Seeded primary admin: ${primaryAdminEmail} (password: admin123)`);
    }

    // Secondary admin
    const secondaryAdminEmail = 'admin@homeswale.com';
    const secAdmin = await User.findOne({ email: secondaryAdminEmail });
    if (!secAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        name: 'PropertyDeal Admin Backup',
        email: secondaryAdminEmail,
        password: hashedPassword,
        role: 'admin',
        phone: '+91 9876543211',
        isBlocked: false,
      });
    }

    // 2. Ensure initial properties exist
    const count = await Property.countDocuments();
    if (count === 0 && admin) {
      console.log('🌱 Seeding initial properties to MongoDB Atlas...');
      const sampleProperties = [
        {
          title: '3 BHK Ultra Luxury Apartment - Supertech Ecovillage',
          description: 'Spacious 3 BHK apartment with modular kitchen, private balcony facing green park, wooden flooring in master bedroom, and premium club access.',
          price: 8500000,
          propertyType: 'Apartment',
          listingType: 'sale',
          city: 'Greater Noida West',
          locality: 'Sector 16B',
          bhk: '3 BHK',
          areaSqft: 1650,
          images: [
            'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
          ],
          status: 'approved',
          isFeatured: true,
          isVerified: true,
          uniqueCode: 'HW-1001',
          owner: admin._id,
        },
        {
          title: '4 BHK Luxury Sky Residence - Trump Towers Noida',
          description: 'High-end sky villa with floor-to-ceiling glass windows, double height living room, Italian marble, private elevator and concierge services.',
          price: 172500000,
          propertyType: 'Sky Villa',
          listingType: 'sale',
          city: 'Noida',
          locality: 'Sector 94',
          bhk: '4 BHK',
          areaSqft: 4500,
          images: [
            'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80',
          ],
          status: 'approved',
          isFeatured: true,
          isVerified: true,
          uniqueCode: 'HW-1002',
          owner: admin._id,
        },
        {
          title: '2 BHK Fully Furnished Flat on Rent - Gaur City 2',
          description: 'Ready to move 2 BHK flat near metro connectivity, gated society with 24x7 security, power backup, swimming pool, and dedicated covered parking.',
          price: 18000,
          propertyType: 'Apartment',
          listingType: 'rent',
          city: 'Greater Noida West',
          locality: 'Gaur City 2',
          bhk: '2 BHK',
          areaSqft: 1050,
          images: [
            'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
          ],
          status: 'approved',
          isFeatured: true,
          isVerified: true,
          uniqueCode: 'HW-1003',
          owner: admin._id,
        },
        {
          title: 'Commercial Retail Shop - Gaur City Mall',
          description: 'High footfall retail shop on Ground Floor near central atrium. Ideal for apparel brand, electronics or specialty cafe.',
          price: 6500000,
          propertyType: 'Commercial Shop',
          listingType: 'sale',
          city: 'Greater Noida West',
          locality: 'Char Murti Chowk',
          bhk: 'Shop',
          areaSqft: 450,
          images: [
            'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
          ],
          status: 'approved',
          isFeatured: true,
          isVerified: true,
          uniqueCode: 'HW-1004',
          owner: admin._id,
        },
        {
          title: 'Residential Plot on Yamuna Expressway (YEIDA)',
          description: 'Gated sector plot located within 15 minutes of Noida International Airport Jewar. Clear title, registry ready, wide 18m road facing.',
          price: 5200000,
          propertyType: 'Plot',
          listingType: 'sale',
          city: 'Yamuna Expressway',
          locality: 'Sector 18 YEIDA',
          bhk: 'Plot',
          areaSqft: 1800,
          images: [
            'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
          ],
          status: 'approved',
          isFeatured: true,
          isVerified: true,
          uniqueCode: 'HW-1005',
          owner: admin._id,
        },
        {
          title: 'Girls & Boys PG with 3 Meals - Techzone 4',
          description: 'Modern PG with attached washrooms, high speed Wi-Fi, 3 hot meals daily, gym access, air conditioning, and laundry facilities.',
          price: 9500,
          propertyType: 'PG / Co-living',
          listingType: 'rent',
          city: 'Greater Noida West',
          locality: 'Techzone 4',
          bhk: '1 Room',
          areaSqft: 250,
          images: [
            'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
          ],
          status: 'approved',
          isFeatured: false,
          isVerified: true,
          uniqueCode: 'HW-1006',
          owner: admin._id,
        },
      ];

      for (const p of sampleProperties) {
        await Property.create(p);
      }
      console.log('✅ Seeded sample properties to MongoDB Atlas successfully!');
    }
  } catch (err) {
    console.error('⚠️ Seeding error:', err.message);
  }
}

export default mongoose;
export { connectDB };