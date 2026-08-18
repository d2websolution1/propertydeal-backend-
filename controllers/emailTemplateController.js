import EmailTemplate from '../models/EmailTemplate.js';

const DEFAULT_TEMPLATES = [
  { templateKey: 'welcome', name: 'Welcome Email', subject: 'Welcome to Housing!', body: 'Hi {{name}}, welcome aboard!' },
  { templateKey: 'otp', name: 'OTP Verification', subject: 'Your OTP Code', body: 'Your OTP is {{otp}}. Valid for 10 minutes.' },
  { templateKey: 'listing-approved', name: 'Listing Approved', subject: 'Your listing is live!', body: 'Hi {{name}}, your property "{{propertyTitle}}" has been approved.' },
  { templateKey: 'listing-rejected', name: 'Listing Rejected', subject: 'Listing needs changes', body: 'Hi {{name}}, your listing "{{propertyTitle}}" was rejected. Reason: {{reason}}' },
  { templateKey: 'password-reset', name: 'Password Reset', subject: 'Reset your password', body: 'Click here to reset: {{resetLink}}' },
];

// Internal use — kisi bhi jagah se template fetch karke variables replace karne ke liye
export const getTemplateByKey = async (key) => {
  return EmailTemplate.findOne({ where: { templateKey: key, isActive: true } });
};

// ADMIN
export const getAllTemplatesAdmin = async (req, res) => {
  try {
    for (const t of DEFAULT_TEMPLATES) {
      await EmailTemplate.findOrCreate({ where: { templateKey: t.templateKey }, defaults: t });
    }
    const templates = await EmailTemplate.findAll({ order: [['name', 'ASC']] });
    res.json(templates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateTemplate = async (req, res) => {
  try {
    const template = await EmailTemplate.findByPk(req.params.id);
    if (!template) return res.status(404).json({ message: 'Template nahi mila' });

    const { subject, body, isActive } = req.body;
    if (subject !== undefined) template.subject = subject;
    if (body !== undefined) template.body = body;
    if (isActive !== undefined) template.isActive = isActive;

    await template.save();
    res.json(template);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};