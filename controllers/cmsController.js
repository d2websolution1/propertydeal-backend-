// controllers/cmsController.js
import { Op } from 'sequelize';
import CmsPage from '../models/CmsPage.js';

const slugify = (text) =>
  text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

export const getPublicCmsPage = async (req, res) => {
  try {
    const page = await CmsPage.findOne({ where: { slug: req.params.slug, isPublished: true } });
    if (!page) return res.status(404).json({ message: 'Page nahi mila' });
    res.json(page);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllCmsAdmin = async (req, res) => {
  try {
    const pages = await CmsPage.findAll({ order: [['createdAt', 'DESC']] });
    res.json(pages);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createCmsPage = async (req, res) => {
  try {
    const { title, content, metaTitle, metaDescription, isPublished } = req.body;
    if (!title || !content) return res.status(400).json({ message: 'Title aur content dono chahiye' });

    let slug = slugify(title);
    const existing = await CmsPage.findOne({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    const page = await CmsPage.create({
      title, slug, content, metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      isPublished: isPublished !== undefined ? isPublished : true,
    });
    res.json(page);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateCmsPage = async (req, res) => {
  try {
    const page = await CmsPage.findByPk(req.params.id);
    if (!page) return res.status(404).json({ message: 'Page nahi mila' });

    const { title, content, metaTitle, metaDescription, isPublished } = req.body;

    if (title !== undefined && title !== page.title) {
      let newSlug = slugify(title);
      const existing = await CmsPage.findOne({ where: { slug: newSlug, id: { [Op.ne]: page.id } } });
      if (existing) newSlug = `${newSlug}-${Date.now()}`;
      page.slug = newSlug;
      page.title = title;
    }
    if (content !== undefined) page.content = content;
    if (metaTitle !== undefined) page.metaTitle = metaTitle;
    if (metaDescription !== undefined) page.metaDescription = metaDescription;
    if (isPublished !== undefined) page.isPublished = isPublished;

    await page.save();
    res.json(page);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteCmsPage = async (req, res) => {
  try {
    const page = await CmsPage.findByPk(req.params.id);
    if (!page) return res.status(404).json({ message: 'Page nahi mila' });
    await page.destroy();
    res.json({ message: 'Page deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};