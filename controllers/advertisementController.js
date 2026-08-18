// controllers/advertisementController.js
import { Op } from 'sequelize';
import Advertisement from '../models/Advertisement.js';

export const getPublicAds = async (req, res) => {
  try {
    const { position } = req.query;
    const today = new Date().toISOString().slice(0, 10);

    const where = { isActive: true, [Op.or]: [{ startDate: null }, { startDate: { [Op.lte]: today } }] };
    if (position) where.position = position;

    const ads = await Advertisement.findAll({ where });
    const validAds = ads.filter((ad) => !ad.endDate || ad.endDate >= today);
    res.json(validAds);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const trackClick = async (req, res) => {
  try {
    const ad = await Advertisement.findByPk(req.params.id);
    if (!ad) return res.status(404).json({ message: 'Ad nahi mila' });
    ad.clicks += 1;
    await ad.save();
    res.json({ message: 'tracked' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllAdsAdmin = async (req, res) => {
  try {
    const ads = await Advertisement.findAll({ order: [['createdAt', 'DESC']] });
    res.json(ads);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createAd = async (req, res) => {
  try {
    const { title, image, link, position, startDate, endDate } = req.body;
    if (!title || !image) return res.status(400).json({ message: 'Title aur image dono chahiye' });

    const ad = await Advertisement.create({
      title, image, link: link || null, position: position || 'sidebar',
      startDate: startDate || null, endDate: endDate || null,
    });
    res.json(ad);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateAd = async (req, res) => {
  try {
    const ad = await Advertisement.findByPk(req.params.id);
    if (!ad) return res.status(404).json({ message: 'Ad nahi mila' });

    const fields = ['title', 'image', 'link', 'position', 'startDate', 'endDate', 'isActive'];
    fields.forEach((f) => { if (req.body[f] !== undefined) ad[f] = req.body[f]; });

    await ad.save();
    res.json(ad);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteAd = async (req, res) => {
  try {
    const ad = await Advertisement.findByPk(req.params.id);
    if (!ad) return res.status(404).json({ message: 'Ad nahi mila' });
    await ad.destroy();
    res.json({ message: 'Ad deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};