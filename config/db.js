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
import Payment from '../models/Payment.js';
import Subscription from '../models/Subscription.js';
import { seedRealDatabaseData } from './seedRealData.js';

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

    // 3. Ensure standard website sections exist for Homepage, Rent, Commercial, Plots, and PG
    await seedHomeSections();

    // 4. Ensure real payments, subscriptions, enquiries, and blogs exist in MongoDB Atlas
    await seedRealDatabaseData();
  } catch (err) {
    console.error('⚠️ Seeding error:', err.message);
  }
}

async function seedHomeSections() {
  try {
    const defaultSections = [
      // ── HOMEPAGE SECTIONS ──
      {
        sectionKey: 'hero_buy_tiles',
        title: 'Properties to Buy',
        subtitle: '7,000+ verified listings added daily directly from owners & top builders.',
        page: 'homepage',
        displayOrder: 1,
        items: [
          {
            id: 'tile_1',
            title: 'Owner Properties',
            badge: '0% Brokerage',
            desc: 'Direct owner deals →',
            link: '/?filter=owner',
            image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
          },
          {
            id: 'tile_2',
            title: 'Luxury Projects',
            badge: 'New Launch',
            desc: 'Gated townships →',
            link: '/commercial',
            image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
          },
          {
            id: 'tile_3',
            title: 'Ready to Move',
            badge: 'Instant Key',
            desc: 'Immediate possession →',
            link: '/?status=ready',
            image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=80',
          },
          {
            id: 'tile_4',
            title: 'Budget Homes',
            badge: 'Under ₹50 L',
            desc: 'Affordable options →',
            link: '/?max=5000000',
            image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80',
          },
        ],
      },
      {
        sectionKey: 'prominent_projects',
        title: 'Prominent projects to explore',
        subtitle: 'Best projects to look out for',
        page: 'homepage',
        displayOrder: 2,
        items: [
          {
            id: 'prom_1',
            title: 'Jains Central Park East',
            subtitle: 'by Jain Constructions',
            price: '₹1.22 Cr - 1.42 Cr',
            badge: '3 BHK Apartment',
            location: 'Narapally, Hyderabad',
            image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=900&h=600&fit=crop&auto=format',
            link: '/commercial',
          },
          {
            id: 'prom_2',
            title: 'KMR Luxor Exclusive',
            subtitle: 'by KMR Estates & Builders Pvt.Ltd.',
            price: '₹1.06 Cr - 1.27 Cr',
            badge: '2.5, 3 BHK Apartments',
            location: 'Miyapur, Hyderabad',
            image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&h=600&fit=crop&auto=format',
            link: '/commercial',
          },
          {
            id: 'prom_3',
            title: 'Sri Sai Enclave',
            subtitle: 'by Sri Sai Builders',
            price: '₹85 L - 1.1 Cr',
            badge: '2, 3 BHK Apartments',
            location: 'Kondapur, Hyderabad',
            image: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=900&h=600&fit=crop&auto=format',
            link: '/commercial',
          },
          {
            id: 'prom_4',
            title: 'Aparna Sarovar Zenith',
            subtitle: 'by Aparna Constructions',
            price: '₹1.5 Cr - 2.2 Cr',
            badge: '3, 4 BHK Apartments',
            location: 'Nallagandla, Hyderabad',
            image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=900&h=600&fit=crop&auto=format',
            link: '/commercial',
          },
        ],
      },
      {
        sectionKey: 'top_highlighted_projects',
        title: 'Top Highlighted Projects',
        subtitle: 'Handpicked high-yield projects for smart buyers',
        page: 'homepage',
        displayOrder: 3,
        items: [
          {
            id: 'thp_1',
            title: 'Eldeco Live By The Greens',
            subtitle: 'Sector 150, Noida',
            price: '₹95 Lakh onwards',
            badge: 'Resort Living',
            image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
            link: '/commercial',
          },
          {
            id: 'thp_2',
            title: 'Godrej Woods',
            subtitle: 'Sector 43, Noida',
            price: '₹1.85 Cr onwards',
            badge: 'Urban Forest',
            image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
            link: '/commercial',
          },
          {
            id: 'thp_3',
            title: 'ATS Dolce',
            subtitle: 'Zeta 1, Greater Noida',
            price: '₹75 Lakh onwards',
            badge: 'Ready Possession',
            image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
            link: '/commercial',
          },
        ],
      },
      {
        sectionKey: 'trusted_developer_projects',
        title: 'Trusted Developer Projects',
        subtitle: 'RERA-registered projects backed by grade-A builders',
        page: 'homepage',
        displayOrder: 4,
        items: [
          {
            id: 'tdp_1',
            title: 'DLF The Crest',
            subtitle: 'DLF Phase 5, Gurgaon',
            price: '₹5.5 Cr onwards',
            badge: 'Super Luxury',
            image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
            link: '/commercial',
          },
          {
            id: 'tdp_2',
            title: 'Tata Primanti',
            subtitle: 'Southern Peripheral Road, Gurgaon',
            price: '₹3.2 Cr onwards',
            badge: 'Eco Living',
            image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
            link: '/commercial',
          },
        ],
      },
      {
        sectionKey: 'featured_developers',
        title: 'Featured Developers',
        subtitle: 'Renowned developers with proven legacy',
        page: 'homepage',
        displayOrder: 5,
        items: [
          {
            id: 'dev_1',
            title: 'Godrej Properties',
            subtitle: '120+ Completed Projects',
            badge: 'Pan India',
            desc: '30+ Years Experience',
            image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
            link: '/commercial',
          },
          {
            id: 'dev_2',
            title: 'DLF Limited',
            subtitle: 'India’s Largest Developer',
            badge: 'Delhi NCR',
            desc: '75+ Years Legacy',
            image: 'https://images.unsplash.com/photo-1554469384-e58fac16e23a?auto=format&fit=crop&w=600&q=80',
            link: '/commercial',
          },
          {
            id: 'dev_3',
            title: 'Prestige Group',
            subtitle: 'Leading South India Builder',
            badge: 'Bangalore & Mumbai',
            desc: '250+ Landmarks',
            image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80',
            link: '/commercial',
          },
        ],
      },

      // ── RENT PAGE SECTIONS ──
      {
        sectionKey: 'hero_rent_tiles',
        title: 'Properties for Rent',
        subtitle: 'Verified flats, furnished apartments & houses on rent with zero hassle.',
        page: 'rent',
        displayOrder: 1,
        items: [
          {
            id: 'rent_tile_1',
            title: 'Fully Furnished Flats',
            badge: 'Zero Brokerage',
            desc: 'Move-in ready homes →',
            image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
            link: '/rent?type=Apartment',
          },
          {
            id: 'rent_tile_2',
            title: 'Gated Society Homes',
            badge: 'Family Friendly',
            desc: 'Clubhouse, parks & security →',
            image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80',
            link: '/rent',
          },
          {
            id: 'rent_tile_3',
            title: 'Budget Friendly Rents',
            badge: 'Under ₹15,000',
            desc: 'Affordable rentals →',
            image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
            link: '/rent?maxPrice=15000',
          },
          {
            id: 'rent_tile_4',
            title: 'Luxury Sky Residences',
            badge: 'Premium Rent',
            desc: 'Penthouse & villas →',
            image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80',
            link: '/rent',
          },
        ],
      },
      {
        sectionKey: 'rent_recommended_sellers',
        title: 'Recommended Sellers & Landlords',
        subtitle: 'Verified property owners with fast response',
        page: 'rent',
        displayOrder: 2,
        items: [
          {
            id: 'rs_1',
            title: 'Supertech Capetown Owners',
            subtitle: 'Sector 74, Noida',
            badge: 'Verified Owner',
            price: '₹22,000/mo',
            image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
            link: '/rent',
          },
          {
            id: 'rs_2',
            title: 'Gaur City 2 Landlords',
            subtitle: 'Greater Noida West',
            badge: 'Immediate Key',
            price: '₹16,500/mo',
            image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80',
            link: '/rent',
          },
        ],
      },

      // ── COMMERCIAL PAGE SECTIONS ──
      {
        sectionKey: 'commercial_recently_added_sale',
        title: 'Recently Added Commercial For Sale',
        subtitle: 'High footfall retail shops & Grade-A corporate offices',
        page: 'commercial',
        displayOrder: 1,
        items: [
          {
            id: 'c_sale_1',
            title: 'Gaur City Center High Street Retail',
            subtitle: 'Char Murti Chowk, Greater Noida West',
            badge: '12% Guaranteed Rental',
            price: '₹45 Lakh onwards',
            image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
            link: '/commercial',
          },
          {
            id: 'c_sale_2',
            title: 'Bhutani Cyberthum IT Office Spaces',
            subtitle: 'Sector 140A, Noida Expressway',
            badge: 'Grade-A Lockable',
            price: '₹35 Lakh onwards',
            image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
            link: '/commercial',
          },
        ],
      },
      {
        sectionKey: 'commercial_recently_added_rent',
        title: 'Recently Added Commercial For Rent',
        subtitle: 'Fully furnished office spaces & anchor stores',
        page: 'commercial',
        displayOrder: 2,
        items: [
          {
            id: 'c_rent_1',
            title: 'Ready Co-working Space 50 Seats',
            subtitle: 'Sector 62, Noida (Near Metro)',
            badge: 'Furnished Plug & Play',
            price: '₹6,500 / seat',
            image: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80',
            link: '/commercial',
          },
          {
            id: 'c_rent_2',
            title: 'Ground Floor Showroom Space',
            subtitle: 'Mall of India Road, Sector 18, Noida',
            badge: 'High Footfall',
            price: '₹1.5 Lakh / mo',
            image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
            link: '/commercial',
          },
        ],
      },
      {
        sectionKey: 'commercial_housing_experts',
        title: 'Commercial Property Experts',
        subtitle: 'Verified consultants for high ROI commercial portfolios',
        page: 'commercial',
        displayOrder: 3,
        items: [
          {
            id: 'exp_1',
            title: 'Vikas Singhal',
            subtitle: 'Retail & Mall Specialist',
            badge: 'Top Consultant',
            desc: '15+ Years Delhi NCR Experience',
            image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80',
            link: '/commercial',
          },
          {
            id: 'exp_2',
            title: 'Pooja Agarwal',
            subtitle: 'IT Park & Corporate Leasing',
            badge: '500+ Deals Closed',
            desc: 'Gurgaon & Noida Specialist',
            image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
            link: '/commercial',
          },
        ],
      },

      // ── PLOTS PAGE SECTIONS ──
      {
        sectionKey: 'plots_trending',
        title: 'Trending Plots & Land Across India',
        subtitle: 'Verified registry ready residential & commercial land with clear approvals',
        page: 'plots',
        displayOrder: 1,
        items: [
          {
            id: 'plot_1',
            title: 'YEIDA Jewar Airport Facing Plots',
            subtitle: 'Sector 18 & 20, Yamuna Expressway',
            badge: 'Clear Title',
            price: '₹55 Lakh onwards',
            image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
            link: '/plots',
          },
          {
            id: 'plot_2',
            title: 'Gated Villa Plots in Greater Noida',
            subtitle: 'Near Pari Chowk & Metro Station',
            badge: 'Registry Ready',
            price: '₹75 Lakh onwards',
            image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
            link: '/plots',
          },
        ],
      },

      // ── PG / CO-LIVING PAGE SECTIONS ──
      {
        sectionKey: 'pg_handpicked_collections',
        title: 'Handpicked PG & Co-Living Collections',
        subtitle: 'Fully furnished rooms with 3 meals, AC & high speed Wi-Fi',
        page: 'pg',
        displayOrder: 1,
        items: [
          {
            id: 'pg_1',
            title: 'Luxury Boys & Girls PG - Techzone 4',
            subtitle: 'Near IT SEZ, Greater Noida West',
            badge: '3 Meals + Gym',
            price: '₹8,500 / month',
            image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
            link: '/pg',
          },
          {
            id: 'pg_2',
            title: 'Premium Studio Rooms - Sector 62 Noida',
            subtitle: 'Walking distance to Metro & Colleges',
            badge: 'Private Balcony',
            price: '₹12,000 / month',
            image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
            link: '/pg',
          },
        ],
      },
    ];

    for (const sec of defaultSections) {
      const existing = await HomeSection.findOne({ sectionKey: sec.sectionKey });
      if (!existing) {
        await HomeSection.create(sec);
        console.log(`⭐ Seeded section: "${sec.title}" (${sec.sectionKey})`);
      }
    }
    console.log('✅ All default sections verified in MongoDB Atlas!');
  } catch (err) {
    console.error('⚠️ HomeSection seeding error:', err.message);
  }
}

export default mongoose;
export { connectDB, seedHomeSections };