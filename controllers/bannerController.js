import PopupBanner from '../models/PopupBanner.js';

export const getPublicBanners = async (req, res) => {
  try {
    const { page } = req.query;
    const today = new Date().toISOString().slice(0, 10);

    const banners = await PopupBanner.findAll({ where: { isActive: true } });

    const valid = banners.filter((b) => {
      if (b.startDate && b.startDate > today) return false;
      if (b.endDate && b.endDate < today) return false;
      if (!page) return true;
      return b.showOnPages.includes('all') || b.showOnPages.includes(page);
    });

    res.json(valid);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllBannersAdmin = async (req, res) => {
  try {
    const banners = await PopupBanner.findAll({ order: [['createdAt', 'DESC']] });
    res.json(banners);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createBanner = async (req, res) => {
  try {
    const { title, image, link, showOnPages, delaySeconds, startDate, endDate } = req.body;
    if (!title || !image) return res.status(400).json({ message: 'Title aur image dono chahiye' });

    const banner = await PopupBanner.create({
      title, image, link: link || null,
      showOnPages: showOnPages || ['homepage'],
      delaySeconds: delaySeconds || 3,
      startDate: startDate || null, endDate: endDate || null,
    });
    res.json(banner);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateBanner = async (req, res) => {
  try {
    const banner = await PopupBanner.findByPk(req.params.id);
    if (!banner) return res.status(404).json({ message: 'Banner nahi mila' });

    const fields = ['title', 'image', 'link', 'showOnPages', 'delaySeconds', 'startDate', 'endDate', 'isActive'];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) banner[f] = req.body[f];
    });

    await banner.save();
    res.json(banner);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteBanner = async (req, res) => {
  try {
    const banner = await PopupBanner.findByPk(req.params.id);
    if (!banner) return res.status(404).json({ message: 'Banner nahi mila' });
    await banner.destroy();
    res.json({ message: 'Banner deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};