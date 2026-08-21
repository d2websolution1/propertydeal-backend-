// models/BlogPost.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const BlogPost = sequelize.define('BlogPost', {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  excerpt: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  coverImage: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'General',
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  author: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Admin',
  },
  status: {
    type: DataTypes.ENUM('draft', 'published'),
    defaultValue: 'draft',
  },
  publishedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'blogposts',
  freezeTableName: true,
});

export default BlogPost;