// models/User.js
import mongoose from 'mongoose';
import { applyMongoPlugin } from '../config/mongoPlugin.js';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  firstName: {
    type: String,
    trim: true,
    default: '',
  },
  lastName: {
    type: String,
    trim: true,
    default: '',
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'vendor', 'admin'],
    default: 'user',
  },
  phone: {
    type: String,
    default: null,
  },
  avatar: {
    type: String,
    default: '',
  },
  age: {
    type: Number,
    default: null,
  },
  gender: {
    type: String,
    default: '',
  },
  userType: {
    type: String,
    enum: ['Owner', 'Dealer / Agent', 'Builder'],
    default: 'Owner',
  },
  companyLogo: {
    type: String,
    default: '',
  },
  companyName: {
    type: String,
    default: '',
  },
  reraNumber: {
    type: String,
    default: '',
  },
  city: {
    type: String,
    default: '',
  },
  operatingSince: {
    type: String,
    default: '',
  },
  teamSize: {
    type: String,
    default: '',
  },
  localities: {
    type: String,
    default: '',
  },
  dealsIn: {
    type: [String],
    default: [],
  },
  about: {
    type: String,
    default: '',
  },
  isProfileCompleted: {
    type: Boolean,
    default: false,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
  collection: 'users',
});

applyMongoPlugin(userSchema);

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;