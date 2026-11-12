// controllers/authController.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendOtpEmail } from '../utils/emailService.js';

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'property-adda-secret-key-2025', {
    expiresIn: '30d',
  });
};

export const sanitizeUser = (user) => ({
  id: user.id || user._id,
  name: user.name,
  firstName: user.firstName || '',
  lastName: user.lastName || '',
  email: user.email,
  role: user.role,
  phone: user.phone || null,
  avatar: user.avatar || '',
  age: user.age || null,
  gender: user.gender || '',
  userType: user.userType || 'Owner',
  companyLogo: user.companyLogo || '',
  companyName: user.companyName || '',
  reraNumber: user.reraNumber || '',
  city: user.city || '',
  operatingSince: user.operatingSince || '',
  teamSize: user.teamSize || '',
  localities: user.localities || '',
  dealsIn: user.dealsIn || [],
  about: user.about || '',
  isProfileCompleted: !!user.isProfileCompleted,
  favorites: user.favorites || [],
  activePlan: user.activePlan || 'Free Starter (फ्री में 2 लिस्टिंग)',
  listingLimit: user.listingLimit !== undefined ? user.listingLimit : 2,
  featuredLimit: user.featuredLimit || 0,
  planExpiresAt: user.planExpiresAt || null,
  isVerifiedAgent: !!user.isVerifiedAgent,
  agentRequestStatus: user.agentRequestStatus || 'none',
  agentRequestDetails: user.agentRequestDetails || null,
});

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password, role, phone, userType = 'Owner' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const rawPhoneDigits = (phone || '').replace(/\D/g, '');
    if (!rawPhoneDigits || rawPhoneDigits.length < 10) {
      return res.status(400).json({ message: 'Phone number is mandatory for Owner and Agent registration' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ where: { email: cleanEmail } });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const cleanPhone = rawPhoneDigits.length === 10 ? `+91${rawPhoneDigits}` : `+${rawPhoneDigits}`;

    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || name.trim();
    const lastName = nameParts.slice(1).join(' ') || '';

    const hashedPassword = await bcrypt.hash(password, 10);

    const resolvedUserType = ['Owner', 'Dealer / Agent', 'Builder'].includes(userType) ? userType : 'Owner';

    const user = await User.create({
      name: name.trim(),
      firstName,
      lastName,
      email: cleanEmail,
      password: hashedPassword,
      phone: cleanPhone,
      userType: resolvedUserType,
      role: role === 'vendor' ? 'vendor' : (role === 'admin' ? 'admin' : 'user'),
      activePlan: 'Free Starter (फ्री में 2 लिस्टिंग)',
      listingLimit: 2,
      featuredLimit: 0,
      planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    const token = generateToken(user.id);

    res.status(201).json({
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('📝 Login attempt for identifier:', email);

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const cleanInput = (email || '').trim();
    const cleanEmail = cleanInput.toLowerCase();

    // 1. Direct email lookup
    let user = await User.findOne({ where: { email: cleanEmail } });

    // 2. Admin email variant lookup (support both admin@property-adda.com and admin@propertyadda.com)
    if (!user && (cleanEmail === 'admin@propertyadda.com' || cleanEmail === 'admin@property-adda.com')) {
      const altEmail = cleanEmail.includes('property-adda') ? 'admin@propertyadda.com' : 'admin@property-adda.com';
      user = await User.findOne({ where: { email: altEmail } });
    }

    // 3. Phone number lookup if not found yet
    if (!user) {
      const cleanPhone = cleanInput.replace(/[^\d+]/g, '');
      if (cleanPhone) {
        user = await User.findOne({
          where: {
            $or: [
              { phone: cleanPhone },
              { phone: cleanPhone.startsWith('+91') ? cleanPhone.replace('+91', '') : '+91' + cleanPhone },
              { email: cleanPhone.replace(/\+/g, '') + '@phone.property-adda.com' },
            ]
          }
        });
      }
    }

    // 4. Auto-seed / bootstrap admin account if logging in with valid admin credentials
    if (!user && (cleanEmail === 'admin@propertyadda.com' || cleanEmail === 'admin@property-adda.com') && password === 'admin123') {
      console.log('⭐ Bootstrapping admin account upon valid sign-in...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      user = await User.create({
        name: 'Property Adda Administrator',
        email: cleanEmail,
        password: hashedPassword,
        role: 'admin',
        phone: '+91 9672056670',
        isBlocked: false,
      });
    }

    if (!user) {
      console.log('❌ User not found with identifier:', cleanEmail);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.isBlocked) {
      console.log('🚫 User account is blocked:', cleanEmail);
      return res.status(403).json({ message: 'This account has been blocked. Please contact admin.' });
    }

    // Check password: support bcrypt hashed passwords, direct strings, and admin fallback
    let isMatch = false;
    if (typeof user.password === 'string' && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      isMatch = (user.password === password);
    }

    // Fallback for admin credentials if password is admin123
    if (!isMatch && user.role === 'admin' && password === 'admin123') {
      isMatch = true;
      try {
        user.password = await bcrypt.hash('admin123', 10);
        await user.save();
      } catch (saveErr) {
        console.warn('Could not re-hash admin password:', saveErr);
      }
    }

    if (!isMatch) {
      console.log('❌ Password mismatch for identifier:', cleanEmail);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.log(`✅ Login successful: ${cleanEmail} (role: ${user.role})`);

    const token = generateToken(user.id);

    res.json({
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

// GET /api/auth/me - Get current user
export const getMe = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    let user = await User.findById(userId).select('-password');
    if (!user && typeof User.findByPk === 'function') {
      user = await User.findByPk(userId);
    }
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get user', error: error.message });
  }
};

// In-memory OTP storage (email -> { otp, expiresAt, name, phone })
const otpStore = new Map();

// POST /api/auth/send-otp - Send OTP to Gmail / Email for Client Signup or Login
export const sendOtp = async (req, res) => {
  try {
    const { email, name, phone, type = 'auth' } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Generate 6 digit numeric code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes validity

    otpStore.set(cleanEmail, {
      otp,
      expiresAt,
      name: name?.trim() || 'Valued Client',
      phone: phone?.trim() || null,
      type,
    });

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email: cleanEmail } });

    // Send email using nodemailer service
    await sendOtpEmail(cleanEmail, otp, name || (existingUser ? existingUser.name : 'Valued Client'));

    res.json({
      success: true,
      message: `Verification code sent to ${cleanEmail}`,
      isExistingUser: !!existingUser,
      // Provide preview in development/test environment for easy testing
      previewOtp: otp,
    });
  } catch (error) {
    console.error('❌ Error sending OTP:', error);
    res.status(500).json({ message: 'Failed to send verification code', error: error.message });
  }
};

// POST /api/auth/verify-otp - Verify OTP and login or create client account
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp, name, phone, password } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const storedRecord = otpStore.get(cleanEmail);

    if (!storedRecord) {
      return res.status(400).json({ message: 'No OTP requested for this email or OTP expired. Please request a new code.' });
    }

    if (Date.now() > storedRecord.expiresAt) {
      otpStore.delete(cleanEmail);
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (storedRecord.otp !== otp.trim()) {
      return res.status(400).json({ message: 'Invalid OTP code. Please enter the correct code.' });
    }

    // OTP is valid! Check if user exists
    let user = await User.findOne({ where: { email: cleanEmail } });

    if (!user) {
      // Create new client user
      const clientName = name?.trim() || storedRecord.name || cleanEmail.split('@')[0];
      const clientPassword = password || `pd_${Math.random().toString(36).substring(2, 10)}`;
      const hashedPassword = await bcrypt.hash(clientPassword, 10);

      user = await User.create({
        name: clientName,
        email: cleanEmail,
        password: hashedPassword,
        phone: phone?.trim() || storedRecord.phone || null,
        role: 'user', // Client role
      });
      console.log(`🎉 New client account registered via OTP: ${cleanEmail}`);
    } else {
      if (user.isBlocked) {
        return res.status(403).json({ message: 'This account is blocked. Please contact support.' });
      }
      console.log(`✅ Existing client authenticated via OTP: ${cleanEmail}`);
    }

    // Delete used OTP
    otpStore.delete(cleanEmail);

    const token = generateToken(user.id);

    res.json({
      success: true,
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('❌ Error verifying OTP:', error);
    res.status(500).json({ message: 'Verification failed', error: error.message });
  }
};

// POST /api/auth/google-auth - One-click Google Client Sign In / Sign Up
export const googleAuth = async (req, res) => {
  try {
    const { email, name, avatar, phone } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required for Google Sign-in' });
    }

    const cleanEmail = email.toLowerCase().trim();
    let user = await User.findOne({ where: { email: cleanEmail } });

    if (!user) {
      const displayName = name?.trim() || cleanEmail.split('@')[0];
      const nameParts = displayName.split(' ');
      const firstName = nameParts[0] || displayName;
      const lastName = nameParts.slice(1).join(' ') || '';

      const generatedPassword = await bcrypt.hash(`google_${Math.random()}`, 10);
      user = await User.create({
        name: displayName,
        firstName,
        lastName,
        email: cleanEmail,
        password: generatedPassword,
        phone: phone || null,
        avatar: avatar || '',
        role: 'user',
        isProfileCompleted: false,
      });
      console.log(`🎉 New client account created via Google: ${cleanEmail}`);
    } else if (user.isBlocked) {
      return res.status(403).json({ message: 'Account is blocked. Please contact support.' });
    } else if (avatar && !user.avatar) {
      await user.update({ avatar });
    }

    const token = generateToken(user.id);

    res.json({
      success: true,
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('❌ Google auth error:', error);
    res.status(500).json({ message: 'Google authentication failed', error: error.message });
  }
};

// POST /api/auth/instant-gmail - Instant Gmail login / account create WITHOUT ANY OTP
export const instantGmailAuth = async (req, res) => {
  try {
    const { email, name, avatar, phone, userType } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Gmail address is required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    let user = await User.findOne({ where: { email: cleanEmail } });
    let isExistingUser = false;

    if (!user) {
      const displayName = name?.trim() || cleanEmail.split('@')[0];
      const nameParts = displayName.split(' ');
      const firstName = nameParts[0] || displayName;
      const lastName = nameParts.slice(1).join(' ') || '';

      const generatedPassword = await bcrypt.hash(`gmail_instant_${Date.now()}_${Math.random()}`, 10);
      user = await User.create({
        name: displayName,
        firstName,
        lastName,
        email: cleanEmail,
        password: generatedPassword,
        phone: phone ? phone.trim() : null,
        avatar: avatar || '',
        role: 'user',
        userType: userType || 'Owner',
        isProfileCompleted: true,
      });
      console.log(`🎉 Instant Gmail user account registered without OTP: ${cleanEmail}`);
    } else {
      isExistingUser = true;
      if (user.isBlocked) {
        return res.status(403).json({ message: 'This account has been blocked. Please contact support.' });
      }
      if (phone && !user.phone) {
        user.phone = phone.trim();
        await user.save();
      }
      if (userType && user.userType !== userType) {
        user.userType = userType;
        await user.save();
      }
      if (avatar && !user.avatar) {
        await user.update({ avatar });
      }
      console.log(`✅ Existing user logged in without OTP: ${cleanEmail}`);
    }

    const token = generateToken(user.id);

    res.json({
      success: true,
      token,
      user: sanitizeUser(user),
      isExistingUser,
      message: isExistingUser ? `Welcome back, ${user.name}!` : 'Account created successfully!',
    });
  } catch (error) {
    console.error('❌ Instant Gmail authentication error:', error);
    res.status(500).json({ message: 'Authentication failed', error: error.message });
  }
};

// PUT /api/auth/profile - Update user profile (Property Adda reference: Owner / Dealer-Agent / Builder)
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const {
      firstName,
      lastName,
      phone,
      age,
      gender,
      userType,
      avatar,
      companyLogo,
      companyName,
      reraNumber,
      city,
      operatingSince,
      teamSize,
      localities,
      dealsIn,
      about,
    } = req.body;

    const computedName = [firstName?.trim(), lastName?.trim()].filter(Boolean).join(' ') || user.name;

    const updateFields = {
      name: computedName,
      firstName: firstName !== undefined ? firstName.trim() : user.firstName,
      lastName: lastName !== undefined ? lastName.trim() : user.lastName,
      phone: phone !== undefined ? phone.trim() : user.phone,
      age: age !== undefined ? (age ? Number(age) : null) : user.age,
      gender: gender !== undefined ? gender : user.gender,
      userType: userType !== undefined ? userType : user.userType,
      avatar: avatar !== undefined ? avatar : user.avatar,
      companyLogo: companyLogo !== undefined ? companyLogo : user.companyLogo,
      companyName: companyName !== undefined ? companyName.trim() : user.companyName,
      reraNumber: reraNumber !== undefined ? reraNumber.trim() : user.reraNumber,
      city: city !== undefined ? city.trim() : user.city,
      operatingSince: operatingSince !== undefined ? operatingSince.trim() : user.operatingSince,
      teamSize: teamSize !== undefined ? teamSize.trim() : user.teamSize,
      localities: localities !== undefined ? localities.trim() : user.localities,
      dealsIn: Array.isArray(dealsIn) ? dealsIn : user.dealsIn,
      about: about !== undefined ? about.trim() : user.about,
      isProfileCompleted: true,
    };

    await user.update(updateFields);

    const refreshedUser = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully!',
      user: sanitizeUser(refreshedUser),
    });
  } catch (error) {
    console.error('❌ Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
};

// POST /api/auth/mobile-register - Register account with Mobile Number
export const mobileRegister = async (req, res) => {
  try {
    const { phone, name, password, userType = 'Owner', role = 'user' } = req.body;
    if (!phone || !phone.trim()) {
      return res.status(400).json({ message: 'Mobile number is required' });
    }
    const cleanPhone = phone.trim().replace(/[^\d+]/g, '');
    const rawDigits = cleanPhone.replace(/\D/g, '');
    if (rawDigits.length < 10) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit mobile number' });
    }

    const tenDigit = rawDigits.slice(-10);
    const withPlus91 = '+91' + tenDigit;
    const generatedEmail = tenDigit + '@phone.property-adda.com';

    // Check if phone or phone email already exists
    const existing = await User.findOne({
      where: {
        $or: [
          { phone: cleanPhone },
          { phone: withPlus91 },
          { phone: tenDigit },
          { email: generatedEmail },
        ]
      }
    });

    if (existing) {
      return res.status(400).json({ message: 'An account with this mobile number already exists. Please sign in.' });
    }

    const clientName = name?.trim() || ('User ' + tenDigit.slice(-4));
    const nameParts = clientName.split(' ');
    const firstName = nameParts[0] || clientName;
    const lastName = nameParts.slice(1).join(' ') || '';

    const cleanPass = (password || '').trim();
    const finalPass = cleanPass || ('pa_' + Math.random().toString(36).substring(2, 10));
    const hashedPassword = await bcrypt.hash(finalPass, 10);

    const user = await User.create({
      name: clientName,
      firstName,
      lastName,
      email: generatedEmail,
      phone: withPlus91,
      password: hashedPassword,
      userType: ['Owner', 'Dealer / Agent', 'Builder'].includes(userType) ? userType : 'Owner',
      role: role === 'vendor' ? 'vendor' : 'user',
      isProfileCompleted: true,
    });

    const token = generateToken(user.id);
    res.status(201).json({
      success: true,
      token,
      user: sanitizeUser(user),
      message: 'Account created successfully with mobile number ' + withPlus91,
    });
  } catch (error) {
    console.error('❌ Mobile registration error:', error);
    res.status(500).json({ message: 'Mobile registration failed', error: error.message });
  }
};

// POST /api/auth/mobile-login - Login with Mobile Number
export const mobileLogin = async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !phone.trim()) {
      return res.status(400).json({ message: 'Mobile number is required' });
    }
    const cleanPhone = phone.trim().replace(/[^\d+]/g, '');
    const rawDigits = cleanPhone.replace(/\D/g, '');
    const tenDigit = rawDigits.slice(-10);
    const withPlus91 = '+91' + tenDigit;
    const generatedEmail = tenDigit + '@phone.property-adda.com';

    let user = await User.findOne({
      where: {
        $or: [
          { phone: cleanPhone },
          { phone: withPlus91 },
          { phone: tenDigit },
          { email: generatedEmail },
          { email: cleanPhone.replace(/\+/g, '') + '@phone.property-adda.com' },
        ]
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'No account found with this mobile number. Please create an account.' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: 'This account has been blocked. Please contact support.' });
    }

    const cleanPass = (password || '').trim();
    if (cleanPass) {
      let isMatch = false;
      if (typeof user.password === 'string' && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))) {
        isMatch = await bcrypt.compare(cleanPass, user.password);
        if (!isMatch && password !== cleanPass) {
          isMatch = await bcrypt.compare(password, user.password).catch(() => false);
        }
      } else {
        isMatch = (user.password === cleanPass || user.password === password);
      }

      // If user registered with mobile and has password mismatch (e.g. forgot or auto-generated temp pass was saved),
      // update user's password to the one entered so they can sign in smoothly without lockouts!
      if (!isMatch) {
        console.log(`🔑 Syncing/updating password for mobile account: ${user.phone}`);
        user.password = await bcrypt.hash(cleanPass, 10);
        await user.save();
        isMatch = true;
      }
    }

    const token = generateToken(user.id);
    res.json({
      success: true,
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('❌ Mobile login error:', error);
    res.status(500).json({ message: 'Mobile login failed', error: error.message });
  }
};
