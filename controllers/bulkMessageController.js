import User from '../models/User.js';
import BulkMessageLog from '../models/BulkMessageLog.js';

export const getAudiencePreview = async (req, res) => {
  try {
    const { audience } = req.query;
    let where = {};
    if (audience === 'blocked') where = { isBlocked: true };
    // 'owners'/'tenants' abhi role field pe depend karega agar aapke users table mein hai

    const count = await User.count({ where });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const sendBulkMessage = async (req, res) => {
  try {
    const { channel, audience, subject, message } = req.body;

    if (!channel || !audience || !message) {
      return res.status(400).json({ message: 'Channel, audience aur message zaroori hain' });
    }

    let where = {};
    if (audience === 'blocked') where = { isBlocked: true };

    const recipients = await User.findAll({ where, attributes: ['id', 'name', 'email', 'phone'] });

    const log = await BulkMessageLog.create({
      channel, audience, subject: subject || null, message,
      recipientCount: recipients.length,
      status: 'pending',
    });

    // ─────────────────────────────────────────────────────────────
    // ⚠️ YAHAN ACTUAL PROVIDER INTEGRATION HOGA
    // Jab aap decide karein WhatsApp/SMS/Email provider (Twilio, MSG91,
    // Gupshup, Nodemailer, etc.), yahan loop chala kar har recipient ko
    // bhejna hoga. Abhi ke liye sirf log ban raha hai (status: pending).
    //
    // Example (Twilio SMS jaisa kuch):
    // for (const user of recipients) {
    //   await twilioClient.messages.create({ to: user.phone, body: message, from: TWILIO_NUMBER });
    // }
    // ─────────────────────────────────────────────────────────────

    log.status = 'sent'; // abhi ke liye mock — provider lagne ke baad real status set karna
    await log.save();

    res.json({ message: `${recipients.length} logo ko bheja gaya (log #${log.id})`, log });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMessageHistory = async (req, res) => {
  try {
    const logs = await BulkMessageLog.findAll({ order: [['createdAt', 'DESC']], limit: 50 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};