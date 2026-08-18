// models/HomeSection.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

// One row = one section on some page (homepage, rent, commercial, etc.).
// `items` holds the actual cards as flexible JSON so any section shape fits here
// without needing a new table every time you add a section.
const HomeSection = sequelize.define('HomeSection', {
  sectionKey: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    // e.g. 'housing_top_picks', 'prominent_projects', 'featured_developers',
    // 'trusted_developer_projects', 'research_insights', 'recommended_sellers',
    // 'newly_added_properties', 'news_articles'
  },
  page: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'homepage',
    // 'homepage' | 'rent' | 'buy' | 'commercial' | 'pg' | 'plots'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  subtitle: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  items: {
    // Array of cards. Each item can carry whatever fields that section needs:
    // { id, title, subtitle, image, price, location, link, badge, ... }
    type: DataTypes.JSON,
    defaultValue: [],
  },
  displayOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
});

export default HomeSection;