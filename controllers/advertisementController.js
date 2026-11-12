// controllers/advertisementController.js
import Advertisement from '../models/Advertisement.js';

export const getPublicAds = async (req, res) => {
  try {
    const { position } = req.query;
    const now = new Date();

    const query = {
      isActive: true,
      $or: [
        { startDate: null },
        { startDate: { $lte: now } },
      ],
      $and: [
        {
          $or: [
            { endDate: null },
            { endDate: { $gte: now } },
          ],
        },
      ],
    };

    if (position && position !== 'all') {
      query.position = position;
    }

    const ads = await Advertisement.find(query).sort({ createdAt: -1 });
    res.json(ads);
  } catch (err) {
    console.error('getPublicAds error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const trackClick = async (req, res) => {
  try {
    const adId = req.params.id;
    const ad = await Advertisement.findByIdAndUpdate(
      adId,
      { $inc: { clicks: 1 } },
      { new: true }
    );
    if (!ad) return res.status(404).json({ message: 'Ad nahi mila' });
    res.json({ message: 'tracked', clicks: ad.clicks });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllAdsAdmin = async (req, res) => {
  try {
    const ads = await Advertisement.find().sort({ createdAt: -1 });
    res.json(ads);
  } catch (err) {
    console.error('getAllAdsAdmin error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createAd = async (req, res) => {
  try {
    const { title, image, link, position, startDate, endDate } = req.body;
    if (!title || !image) return res.status(400).json({ message: 'Title aur image dono chahiye' });

    const cleanTitle = title.trim();
    const cleanImage = image.trim();

    // Prevent duplicate ad creation within 5 seconds with same title & image
    const recentDuplicate = await Advertisement.findOne({
      title: cleanTitle,
      image: cleanImage,
      createdAt: { $gte: new Date(Date.now() - 5000) },
    });
    if (recentDuplicate) {
      return res.json(recentDuplicate);
    }

    const ad = await Advertisement.create({
      title: cleanTitle,
      image: cleanImage,
      link: (link || '').trim(),
      position: position || 'sidebar',
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      isActive: true,
    });
    res.status(201).json(ad);
  } catch (err) {
    console.error('createAd error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateAd = async (req, res) => {
  try {
    const adId = req.params.id;
    const ad = await Advertisement.findById(adId);
    if (!ad) return res.status(404).json({ message: 'Ad nahi mila' });

    const fields = ['title', 'image', 'link', 'position', 'startDate', 'endDate', 'isActive'];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) {
        if ((f === 'startDate' || f === 'endDate') && req.body[f]) {
          ad[f] = new Date(req.body[f]);
        } else {
          ad[f] = req.body[f];
        }
      }
    });

    await ad.save();
    res.json(ad);
  } catch (err) {
    console.error('updateAd error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteAd = async (req, res) => {
  try {
    const adId = req.params.id;
    const ad = await Advertisement.findByIdAndDelete(adId);
    if (!ad) return res.status(404).json({ message: 'Ad nahi mila' });
    res.json({ message: 'Ad deleted successfully' });
  } catch (err) {
    console.error('deleteAd error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};