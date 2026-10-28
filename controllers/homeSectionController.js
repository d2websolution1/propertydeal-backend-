// controllers/homeSectionController.js
import HomeSection from '../models/HomeSection.js';

// Safely returns section.items as a real array
const parseItems = (rawItems) => {
  if (Array.isArray(rawItems)) return rawItems;
  if (typeof rawItems === 'string') {
    try {
      const parsed = JSON.parse(rawItems);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

// ───────────────────────────────
// PUBLIC
// ───────────────────────────────

export const getPublicSections = async (req, res) => {
  try {
    const sections = await HomeSection.findAll({
      where: { isActive: true },
      order: [['displayOrder', 'ASC']],
    });
    const normalized = sections.map((s) => ({ ...s.toJSON(), items: parseItems(s.items) }));
    res.json(normalized);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load homepage content', error: error.message });
  }
};

export const getPublicSectionByKey = async (req, res) => {
  try {
    const section = await HomeSection.findOne({
      where: { sectionKey: req.params.key, isActive: true },
    });
    if (!section) return res.status(404).json({ message: 'Section not found' });
    res.json({ ...section.toJSON(), items: parseItems(section.items) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load section', error: error.message });
  }
};

// ───────────────────────────────
// ADMIN
// ───────────────────────────────

export const getAllSectionsAdmin = async (req, res) => {
  try {
    const sections = await HomeSection.findAll({
      order: [['displayOrder', 'ASC'], ['createdAt', 'DESC']]
    });
    const normalized = sections.map((s) => ({
      ...s.toJSON(),
      items: parseItems(s.items),
      page: s.page || 'homepage'
    }));
    res.json(normalized);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load sections', error: error.message });
  }
};

export const getSectionsByPage = async (req, res) => {
  try {
    const { page } = req.params;
    const sections = await HomeSection.findAll({
      where: { page: page, isActive: true },
      order: [['displayOrder', 'ASC']],
    });
    const normalized = sections.map((s) => ({
      ...s.toJSON(),
      items: parseItems(s.items)
    }));
    res.json(normalized);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load sections by page', error: error.message });
  }
};

export const createSection = async (req, res) => {
  try {
    const { sectionKey, title, subtitle, items, displayOrder, isActive, page } = req.body;

    if (!sectionKey || !title) {
      return res.status(400).json({ message: 'sectionKey and title are required' });
    }

    const existing = await HomeSection.findOne({ where: { sectionKey } });
    if (existing) {
      return res.status(400).json({ message: 'A section with this key already exists' });
    }

    const section = await HomeSection.create({
      sectionKey,
      title,
      subtitle,
      items: parseItems(items),
      displayOrder: displayOrder ?? 0,
      isActive: isActive ?? true,
      page: page || 'homepage',
    });

    res.status(201).json({ ...section.toJSON(), items: parseItems(section.items) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create section', error: error.message });
  }
};

export const updateSection = async (req, res) => {
  try {
    const section = await HomeSection.findByPk(req.params.id);
    if (!section) return res.status(404).json({ message: 'Section not found' });

    const { title, subtitle, items, displayOrder, isActive, page } = req.body;

    if (title !== undefined) section.title = title;
    if (subtitle !== undefined) section.subtitle = subtitle;
    if (items !== undefined) section.items = parseItems(items);
    else section.items = parseItems(section.items);
    if (displayOrder !== undefined) section.displayOrder = displayOrder;
    if (isActive !== undefined) section.isActive = isActive;
    if (page !== undefined) section.page = page;

    section.markModified('items');
    await section.save();
    res.json({ ...section.toJSON(), items: parseItems(section.items) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update section', error: error.message });
  }
};

export const deleteSection = async (req, res) => {
  try {
    const section = await HomeSection.findByPk(req.params.id);
    if (!section) return res.status(404).json({ message: 'Section not found' });

    await section.destroy();
    res.json({ message: 'Section deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete section', error: error.message });
  }
};

// ── Item-level helpers ──

export const addItem = async (req, res) => {
  try {
    const section = await HomeSection.findByPk(req.params.id);
    if (!section) return res.status(404).json({ message: 'Section not found' });

    const currentItems = parseItems(section.items);
    const newItem = { id: Date.now().toString(), ...req.body };
    section.items = [...currentItems, newItem];
    section.markModified('items');
    await section.save();

    res.status(201).json({ ...section.toJSON(), items: parseItems(section.items) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add item', error: error.message });
  }
};

export const updateItem = async (req, res) => {
  try {
    const section = await HomeSection.findByPk(req.params.id);
    if (!section) return res.status(404).json({ message: 'Section not found' });

    const currentItems = parseItems(section.items);
    section.items = currentItems.map((item) =>
      String(item.id) === String(req.params.itemId) ? { ...item, ...req.body, id: item.id } : item
    );
    section.markModified('items');
    await section.save();

    res.json({ ...section.toJSON(), items: parseItems(section.items) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update item', error: error.message });
  }
};

export const deleteItem = async (req, res) => {
  try {
    const section = await HomeSection.findByPk(req.params.id);
    if (!section) return res.status(404).json({ message: 'Section not found' });

    const currentItems = parseItems(section.items);
    section.items = currentItems.filter(
      (item) => String(item.id) !== String(req.params.itemId)
    );
    section.markModified('items');
    await section.save();

    res.json({ ...section.toJSON(), items: parseItems(section.items) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete item', error: error.message });
  }
};

export const restoreDefaultSections = async (req, res) => {
  try {
    const { seedHomeSections } = await import('../config/db.js');
    await seedHomeSections();
    const sections = await HomeSection.findAll({
      order: [['displayOrder', 'ASC'], ['createdAt', 'DESC']]
    });
    const normalized = sections.map((s) => ({
      ...s.toJSON(),
      items: parseItems(s.items),
      page: s.page || 'homepage'
    }));
    res.json({ success: true, message: 'All default page sections verified and restored!', sections: normalized });
  } catch (error) {
    res.status(500).json({ message: 'Failed to restore default sections', error: error.message });
  }
};