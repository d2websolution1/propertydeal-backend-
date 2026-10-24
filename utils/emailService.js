// Backend/utils/emailService.js
import nodemailer from 'nodemailer';

// Configure transporter if credentials exist
const createTransporter = () => {
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;

  if (user && pass) {
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: { user, pass },
    });
  }

  // Fallback to custom SMTP host if provided
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return null;
};

/**
 * Send 6-digit OTP email to client
 */
export const sendOtpEmail = async (email, otp, name = 'Valued Client') => {
  console.log(`\n==================================================`);
  console.log(`📧 [PropertyDeal OTP]`);
  console.log(`Recipient: ${email}`);
  console.log(`Verification Code (OTP): 👉 ${otp} 👈`);
  console.log(`Time: ${new Date().toLocaleTimeString()}`);
  console.log(`==================================================\n`);

  const transporter = createTransporter();

  if (!transporter) {
    // Return success in development so client auth flows smoothly even without real SMTP
    return {
      sent: true,
      mode: 'simulated',
      message: `OTP logged to server console: ${otp}`,
    };
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; }
        .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .header { background: #2563eb; padding: 28px 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 800; }
        .header p { margin: 4px 0 0; font-size: 13px; opacity: 0.9; }
        .body { padding: 32px 24px; text-align: center; }
        .greeting { font-size: 16px; color: #1e293b; margin-bottom: 16px; text-align: left; }
        .desc { font-size: 14px; color: #64748b; line-height: 1.6; text-align: left; margin-bottom: 24px; }
        .otp-box { background: #eff6ff; border: 2px dashed #93c5fd; border-radius: 12px; padding: 16px; display: inline-block; letter-spacing: 8px; font-size: 32px; font-weight: 800; color: #1d4ed8; margin-bottom: 24px; font-family: monospace; }
        .footer { padding: 20px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>PropertyDeal</h1>
          <p>India's Premium Real Estate Network</p>
        </div>
        <div class="body">
          <p class="greeting">Hello <strong>${name}</strong>,</p>
          <p class="desc">Please use the following 6-digit One-Time Password (OTP) to securely sign in or create your PropertyDeal client account. This OTP is valid for 10 minutes.</p>
          <div class="otp-box">${otp}</div>
          <p class="desc" style="font-size: 12px; color: #94a3b8;">If you did not request this verification code, please ignore this email or contact support.</p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} PropertyDeal India. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"PropertyDeal Support" <${process.env.EMAIL_USER || 'no-reply@propertydeal.com'}>`,
      to: email,
      subject: `${otp} is your PropertyDeal verification code`,
      html: htmlContent,
    });
    return { sent: true, mode: 'smtp', messageId: info.messageId };
  } catch (error) {
    console.error('⚠️ Nodemailer SMTP send failed, falling back to console OTP:', error.message);
    return { sent: true, mode: 'fallback', error: error.message };
  }
};
