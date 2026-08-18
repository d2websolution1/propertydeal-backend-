import SeoSetting from '../models/SeoSetting.js';

const DEFAULT_PAGES = [
  { pageKey: 'homepage', pageLabel: 'Homepage' },
  { pageKey: 'rent', pageLabel: 'Rent Page' },
  { pageKey: 'buy', pageLabel: 'Buy Page' },
  { pageKey: 'commercial', pageLabel: 'Commercial Page' },
  { pageKey: 'plots', pageLabel: 'Plots Page' },
  { pageKey: 'pg', pageLabel: 'PG / Co-living Page' },
  { pageKey: 'blog', pageLabel: 'Blog Listing Page' },
];

export const getPublicSeo = async (req, res) => {
  try {
    const seo = await SeoSetting.findOne({ where: { pageKey: req.params.pageKey } });
    if (!seo) return res.status(404).json({ message: 'SEO data nahi mila' });
    res.json(seo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllSeoAdmin = async (req, res) => {
  try {
    for (const page of DEFAULT_PAGES) {
      await SeoSetting.findOrCreate({ where: { pageKey: page.pageKey }, defaults: { pageLabel: page.pageLabel } });
    }
    const seoSettings = await SeoSetting.findAll({ order: [['pageLabel', 'ASC']] });
    res.json(seoSettings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateSeo = async (req, res) => {
  try {
    const seo = await SeoSetting.findByPk(req.params.id);
    if (!seo) return res.status(404).json({ message: 'SEO setting nahi mila' });

    const { metaTitle, metaDescription, metaKeywords, ogImage, canonicalUrl } = req.body;
    if (metaTitle !== undefined) seo.metaTitle = metaTitle;
    if (metaDescription !== undefined) seo.metaDescription = metaDescription;
    if (metaKeywords !== undefined) seo.metaKeywords = metaKeywords;
    if (ogImage !== undefined) seo.ogImage = ogImage;
    if (canonicalUrl !== undefined) seo.canonicalUrl = canonicalUrl;

    await seo.save();
    res.json(seo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};