// config/seedRealData.js
import User from '../models/User.js';
import Property from '../models/Property.js';
import Payment from '../models/Payment.js';
import Subscription from '../models/Subscription.js';
import Enquiry from '../models/Enquiry.js';
import BlogPost from '../models/BlogPost.js';
import CmsPage from '../models/CmsPage.js';
import PopupBanner from '../models/PopupBanner.js';

export async function seedRealDatabaseData() {
  try {
    const existingUsers = await User.find({});
    const existingProperties = await Property.find({});

    // 1. Seed Real Subscriptions if empty
    const subCount = await Subscription.countDocuments();
    if (subCount === 0) {
      console.log('🌱 Seeding real subscription plans to MongoDB Atlas...');
      await Subscription.create([
        {
          name: 'Owner Free Starter',
          tier: 'free',
          targetAudience: 'Owner',
          price: 0,
          billingCycle: 'one-time',
          listingLimit: 2,
          featuredLimit: 0,
          features: ['Post up to 2 Properties Free', 'Direct Buyer Phone & WhatsApp', 'Standard 30 Days Visibility'],
          badge: 'Basic',
          isActive: true,
        },
        {
          name: 'Owner Fast-Track Verified',
          tier: 'silver',
          targetAudience: 'Owner',
          price: 999,
          billingCycle: 'one-time',
          listingLimit: 5,
          featuredLimit: 1,
          features: ['Verified Green Shield Badge', 'Top 5 in Search Results', 'Instant WhatsApp Inquiries Alert', '45 Days Validity'],
          badge: 'Popular',
          isActive: true,
        },
        {
          name: 'Dealer / Agent Pro Pack',
          tier: 'gold',
          targetAudience: 'Dealer / Agent',
          price: 4999,
          billingCycle: 'monthly',
          listingLimit: 30,
          featuredLimit: 5,
          features: ['Up to 30 Active Listings', '5 Featured Boost Slots', 'Direct RERA & Company Branding', 'CRM Leads Manager', 'Priority Customer Support'],
          badge: 'Recommended',
          isActive: true,
        },
        {
          name: 'Builder Mega Township Enterprise',
          tier: 'platinum',
          targetAudience: 'Builder',
          price: 14999,
          billingCycle: 'monthly',
          listingLimit: 100,
          featuredLimit: 20,
          features: ['Unlimited Floor Plans & Videos', 'Homepage Top Carousel Banner', 'Dedicated Relationship Manager', 'SMS / Email Lead Blasts', 'Verified Developer Blue Tick'],
          badge: 'Enterprise',
          isActive: true,
        },
      ]);
      console.log('✅ Real subscription tiers seeded in MongoDB!');
    }

    // 2. Seed Real Payments if empty
    const paymentCount = await Payment.countDocuments();
    if (paymentCount === 0 && existingUsers.length > 0) {
      console.log('🌱 Seeding real payments to MongoDB Atlas...');
      const dealerUser = existingUsers.find((u) => u.email === 'prince09kumar7714@gmail.com') || existingUsers[0];
      const ownerUser = existingUsers.find((u) => u.email === 'ravi@gmail.com') || existingUsers[1] || existingUsers[0];
      const princeUser = existingUsers.find((u) => u.email === 'prince@gmail.com') || existingUsers[2] || existingUsers[0];
      const builderUser = existingUsers.find((u) => u.email === 'princerajput5868@gmail.com') || existingUsers[3] || existingUsers[0];

      await Payment.create([
        {
          transactionId: 'PAY-IND-84920',
          user: dealerUser?._id,
          userName: dealerUser?.name || 'prince09kumar7714 kumar',
          userEmail: dealerUser?.email || 'prince09kumar7714@gmail.com',
          userPhone: dealerUser?.phone || '+91 9084486898',
          userType: 'Dealer / Agent',
          plan: 'Dealer / Agent Pro Pack',
          amount: 4999,
          status: 'completed',
          paymentMethod: 'UPI',
          property: existingProperties[0]?._id || null,
          propertyTitle: existingProperties[0]?.title || 'Commercial Listing',
          notes: 'GST Invoice issued via UPI auto-pay',
          createdAt: new Date(Date.now() - 86400000 * 1),
        },
        {
          transactionId: 'PAY-IND-73918',
          user: princeUser?._id,
          userName: princeUser?.name || 'Prince',
          userEmail: princeUser?.email || 'prince@gmail.com',
          userPhone: princeUser?.phone || '+91 9876543210',
          userType: 'Owner',
          plan: 'Homepage Featured Boost (30 Days)',
          amount: 2499,
          status: 'completed',
          paymentMethod: 'Razorpay',
          property: existingProperties[1]?._id || null,
          propertyTitle: existingProperties[1]?.title || 'Luxury Apartment',
          notes: 'Promoted on Homepage carousel',
          createdAt: new Date(Date.now() - 86400000 * 3),
        },
        {
          transactionId: 'PAY-IND-61924',
          user: builderUser?._id,
          userName: builderUser?.name || 'Google Verified Client',
          userEmail: builderUser?.email || 'princerajput5868@gmail.com',
          userPhone: builderUser?.phone || '+91 9811223344',
          userType: 'Builder',
          plan: 'Builder Mega Township Enterprise',
          amount: 14999,
          status: 'completed',
          paymentMethod: 'NetBanking',
          property: existingProperties[2]?._id || null,
          propertyTitle: existingProperties[2]?.title || 'Sky Residence Project',
          notes: 'Annual corporate subscription package',
          createdAt: new Date(Date.now() - 86400000 * 6),
        },
        {
          transactionId: 'PAY-IND-52910',
          user: ownerUser?._id,
          userName: ownerUser?.name || 'ravi',
          userEmail: ownerUser?.email || 'ravi@gmail.com',
          userPhone: ownerUser?.phone || '+91 9876543210',
          userType: 'Owner',
          plan: 'Owner Fast-Track Verified',
          amount: 999,
          status: 'completed',
          paymentMethod: 'UPI',
          property: existingProperties[3]?._id || null,
          propertyTitle: existingProperties[3]?.title || 'Flat on Rent',
          notes: 'Verified tag assigned to listing',
          createdAt: new Date(Date.now() - 86400000 * 9),
        },
        {
          transactionId: 'PAY-IND-41829',
          user: ownerUser?._id,
          userName: ownerUser?.name || 'ravi',
          userEmail: ownerUser?.email || 'ravi@gmail.com',
          userPhone: ownerUser?.phone || '+91 9876543210',
          userType: 'Owner',
          plan: 'Owner Fast-Track Verified',
          amount: 999,
          status: 'pending',
          paymentMethod: 'UPI',
          property: existingProperties[4]?._id || null,
          propertyTitle: existingProperties[4]?.title || 'Residential Plot',
          notes: 'Awaiting bank confirmation response',
          createdAt: new Date(Date.now() - 3600000 * 2),
        },
      ]);
      console.log('✅ Real payments seeded in MongoDB Atlas!');
    }

    // 3. Seed Real Enquiries if empty
    const enquiryCount = await Enquiry.countDocuments();
    if (enquiryCount === 0 && existingProperties.length > 0) {
      console.log('🌱 Seeding real customer enquiries to MongoDB Atlas...');
      await Enquiry.create([
        {
          userName: 'Ankit Sharma',
          userEmail: 'ankit.sharma91@gmail.com',
          userPhone: '+91 9811002233',
          property: existingProperties[0]?._id,
          propertyTitle: existingProperties[0]?.title || '3 BHK Ultra Luxury Apartment',
          propertyLocation: existingProperties[0]?.city || 'Greater Noida West',
          message: 'Hi, I want to schedule a physical site visit this Sunday at 11 AM. Is the modular kitchen and covered parking included in this price?',
          status: 'new',
          createdAt: new Date(Date.now() - 3600000 * 4),
        },
        {
          userName: 'Sneha Kapur',
          userEmail: 'sneha.kapur@outlook.com',
          userPhone: '+91 9877112233',
          property: existingProperties[2]?._id || existingProperties[0]?._id,
          propertyTitle: existingProperties[2]?.title || '2 BHK Fully Furnished Flat on Rent',
          propertyLocation: existingProperties[2]?.city || 'Greater Noida West',
          message: 'I am a corporate IT professional working in Sector 62 Noida. Can I move in from next month? Please share the maintenance and security deposit terms.',
          status: 'contacted',
          createdAt: new Date(Date.now() - 86400000 * 1),
        },
        {
          userName: 'Ramesh Mittal & Sons',
          userEmail: 'mittal.retail@yahoo.com',
          userPhone: '+91 9822334455',
          property: existingProperties[3]?._id || existingProperties[0]?._id,
          propertyTitle: existingProperties[3]?.title || 'Commercial Retail Shop',
          propertyLocation: existingProperties[3]?.city || 'Greater Noida West',
          message: 'Interested in opening a pharmacy franchise. What is the expected monthly footfall and front road width?',
          status: 'in_progress',
          createdAt: new Date(Date.now() - 86400000 * 2),
        },
      ]);
      console.log('✅ Real customer enquiries seeded in MongoDB Atlas!');
    }

    // 4. Seed Real Blog Posts if empty
    const blogCount = await BlogPost.countDocuments();
    if (blogCount === 0) {
      console.log('🌱 Seeding real blog articles to MongoDB Atlas...');
      await BlogPost.create([
        {
          title: 'Top 7 Things to Verify Before Buying Property in Delhi NCR in 2026',
          slug: 'top-7-things-verify-before-buying-property-delhi-ncr',
          excerpt: 'Essential checklist covering RERA registration, Occupancy Certificate (OC), encumbrance certificate, and builder credibility.',
          content: 'Buying a dream home is one of the largest financial investments you will ever make. Ensure you check RERA project verification, clear land titles, municipal approvals, and verified builder escrow accounts.',
          coverImage: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80',
          category: 'Buying Guide',
          tags: ['RERA', 'Noida', 'Property Investment', 'Home Loan'],
          author: 'PropertyDeal Editorial',
          status: 'published',
        },
        {
          title: 'Why Yamuna Expressway and Jewar Airport Corridor are Goldmines for Investors',
          slug: 'yamuna-expressway-jewar-airport-corridor-investment-guide',
          excerpt: 'Analysis of infrastructure growth, upcoming logistics hubs, metro expansion and expected appreciation rates.',
          content: 'With the operational timeline of Noida International Airport at Jewar, sectors along Yamuna Expressway have seen over 40% capital appreciation in land values.',
          coverImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
          category: 'Market Trends',
          tags: ['Jewar Airport', 'Yamuna Expressway', 'Plots', 'Commercial'],
          author: 'Market Research Team',
          status: 'published',
        },
        {
          title: 'Rental Agreement vs Lease Deed: Key Legal Differences Every Landlord & Tenant Must Know',
          slug: 'rental-agreement-vs-lease-deed-legal-differences-india',
          excerpt: 'Understanding 11-month rent agreements, stamp duty charges, lock-in periods and dispute resolution.',
          content: 'In India, 11-month rental agreements are standard because they do not mandate compulsory registration under the Registration Act. However, long-term commercial leases require strict stamp duty and registration.',
          coverImage: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1200&q=80',
          category: 'Legal & Finance',
          tags: ['Rent Agreement', 'Tenancy', 'Legal Guide'],
          author: 'Advocate Legal Team',
          status: 'published',
        },
      ]);
      console.log('✅ Real blog articles seeded in MongoDB Atlas!');
    }

    // 5. Seed Real CMS Pages if empty
    const cmsCount = await CmsPage.countDocuments();
    if (cmsCount === 0) {
      console.log('🌱 Seeding real CMS pages to MongoDB Atlas...');
      await CmsPage.create([
        {
          title: 'About PropertyDeal',
          slug: 'about-us',
          content: 'PropertyDeal is India\'s premier real estate discovery marketplace connecting property owners, verified dealers, and reputed builders directly with buyers and tenants. With 100% verified listings, zero hidden brokerage, and real-time CRM tools, we make property transactions fast, transparent, and seamless.',
          metaTitle: 'About PropertyDeal - India\'s Most Trusted Real Estate Platform',
          metaDescription: 'Learn about PropertyDeal mission, leadership, and our commitment to transparent property deals across India.',
          isPublished: true,
        },
        {
          title: 'Terms & Conditions',
          slug: 'terms-and-conditions',
          content: 'By accessing PropertyDeal, you agree to comply with our platform terms. All property listings must reflect authentic ownership, clear pricing, and accurate photographs. Misleading or duplicate listings will be removed by admin.',
          metaTitle: 'Terms & Conditions - PropertyDeal',
          metaDescription: 'Review terms and user policies for PropertyDeal listings and client services.',
          isPublished: true,
        },
        {
          title: 'Privacy Policy',
          slug: 'privacy-policy',
          content: 'Your privacy is paramount. PropertyDeal uses industry-standard 256-bit encryption. Contact details entered during instant Gmail auth are kept secure and shared with verified counterparties strictly for property inquiries.',
          metaTitle: 'Privacy Policy - PropertyDeal',
          metaDescription: 'How PropertyDeal safeguards your personal and transactional information.',
          isPublished: true,
        },
        {
          title: 'Contact Support',
          slug: 'contact-us',
          content: 'Have questions or need assistance with your property listing? Reach our customer desk at support@propertydeal.com or call +91 9876543210 (Mon-Sat, 9 AM - 7 PM).',
          metaTitle: 'Contact Us - PropertyDeal Help Desk',
          metaDescription: 'Get in touch with PropertyDeal client support team.',
          isPublished: true,
        },
      ]);
      console.log('✅ Real CMS pages seeded in MongoDB Atlas!');
    }

    // 6. Seed Real Popup Banner if empty
    const bannerCount = await PopupBanner.countDocuments();
    if (bannerCount === 0) {
      console.log('🌱 Seeding real popup banner to MongoDB Atlas...');
      await PopupBanner.create({
        title: 'Festival Property Carnival 2026',
        image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        link: '/post-property',
        showOnPages: ['homepage', 'rent', 'commercial'],
        delaySeconds: 4,
        isActive: true,
      });
      console.log('✅ Real popup banner seeded in MongoDB Atlas!');
    }
  } catch (err) {
    console.error('⚠️ Real data seeding error:', err.message);
  }
}
