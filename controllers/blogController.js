import BlogPost from '../models/BlogPost.js';
import { Op } from 'sequelize';

const slugify = (text) =>
  text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

export const getPublicBlogs = async (req, res) => {
  try {
    const { category, search } = req.query;
    const where = { status: 'published' };
    if (category) where.category = category;
    if (search) where.title = { [Op.like]: `%${search}%` };

    const blogs = await BlogPost.findAll({ where, order: [['publishedAt', 'DESC']] });
    res.json(blogs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPublicBlogBySlug = async (req, res) => {
  try {
    const blog = await BlogPost.findOne({ where: { slug: req.params.slug, status: 'published' } });
    if (!blog) return res.status(404).json({ message: 'Blog nahi mila' });
    blog.views += 1;
    await blog.save();
    res.json(blog);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllBlogsAdmin = async (req, res) => {
  try {
    const blogs = await BlogPost.findAll({ order: [['createdAt', 'DESC']] });
    res.json(blogs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createBlog = async (req, res) => {
  try {
    const { title, excerpt, content, coverImage, category, tags, author, status } = req.body;
    if (!title || !content) return res.status(400).json({ message: 'Title aur content dono chahiye' });

    let slug = slugify(title);
    const existing = await BlogPost.findOne({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    const blog = await BlogPost.create({
      title, slug, excerpt: excerpt || null, content,
      coverImage: coverImage || null, category: category || 'General',
      tags: tags || [], author: author || 'Admin', status: status || 'draft',
      publishedAt: status === 'published' ? new Date() : null,
    });
    res.json(blog);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateBlog = async (req, res) => {
  try {
    const blog = await BlogPost.findByPk(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog nahi mila' });

    const { title, excerpt, content, coverImage, category, tags, author, status } = req.body;

    if (title !== undefined && title !== blog.title) {
      let newSlug = slugify(title);
      const existing = await BlogPost.findOne({ where: { slug: newSlug, id: { [Op.ne]: blog.id } } });
      if (existing) newSlug = `${newSlug}-${Date.now()}`;
      blog.slug = newSlug;
      blog.title = title;
    }

    if (excerpt !== undefined) blog.excerpt = excerpt;
    if (content !== undefined) blog.content = content;
    if (coverImage !== undefined) blog.coverImage = coverImage;
    if (category !== undefined) blog.category = category;
    if (tags !== undefined) blog.tags = tags;
    if (author !== undefined) blog.author = author;

    if (status !== undefined && status !== blog.status) {
      blog.status = status;
      if (status === 'published' && !blog.publishedAt) blog.publishedAt = new Date();
    }

    await blog.save();
    res.json(blog);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteBlog = async (req, res) => {
  try {
    const blog = await BlogPost.findByPk(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog nahi mila' });
    await blog.destroy();
    res.json({ message: 'Blog deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};