// Backend/utils/emailService.js
import nodemailer from 'nodemailer';

// Configure transporter if credentials exist
const createTransporter = () => {
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;

  if (user && pass) {
    // If SMTP_HOST or EMAIL_HOST is provided (e.g. smtp.hostinger.com)
    if (process.env.SMTP_HOST || process.env.EMAIL_HOST) {
      const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
      const port = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT) || 465;
      const secure = process.env.SMTP_SECURE !== undefined ? process.env.SMTP_SECURE === 'true' : (port === 465);

      return nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
      });
    }

    // Default to Gmail service if user has a gmail address or EMAIL_SERVICE is specified
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
    });
  }

  // Fallback to custom SMTP host if provided without user/pass
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      tls: { rejectUnauthorized: false },
    });
  }

  return null;
};

/**
 * Send 6-digit OTP email to client
 */
export const sendOtpEmail = async (email, otp, name = 'Valued Client') => {
  console.log(`\n==================================================`);
  console.log(`📧 [Property Adda Real-time OTP Dispatch]`);
  console.log(`Recipient: ${email}`);
  console.log(`Verification Code (OTP): 👉 ${otp} 👈`);
  console.log(`Time: ${new Date().toLocaleTimeString()}`);
  console.log(`==================================================\n`);

  const transporter = createTransporter();

  if (!transporter) {
    console.warn(`⚠️ [SMTP Notice]: EMAIL_USER / EMAIL_PASS or SMTP credentials not set in environment.`);
    console.warn(`   Configure EMAIL_USER and EMAIL_PASS (or Hostinger SMTP credentials) in Render environment variables to send live emails to inboxes.`);
    return {
      sent: false,
      mode: 'unconfigured',
      message: 'SMTP credentials not configured in environment',
    };
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F3F5F8; margin: 0; padding: 24px; }
        .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(20,45,78,0.08); }
        .header { background: #142D4E; padding: 28px 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 800; }
        .header h1 span { color: #D62839; }
        .header p { margin: 4px 0 0; font-size: 13px; opacity: 0.9; }
        .body { padding: 32px 24px; text-align: center; }
        .greeting { font-size: 16px; color: #142D4E; margin-bottom: 16px; text-align: left; }
        .desc { font-size: 14px; color: #64748B; line-height: 1.6; text-align: left; margin-bottom: 24px; }
        .otp-box { background: #fff1f2; border: 2px dashed #D62839; border-radius: 12px; padding: 16px; display: inline-block; letter-spacing: 8px; font-size: 34px; font-weight: 800; color: #D62839; margin-bottom: 24px; font-family: monospace; }
        .footer { padding: 20px 24px; background: #F3F5F8; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748B; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Property<span>Adda</span></h1>
          <p>India's Premium Real Estate Network</p>
        </div>
        <div class="body">
          <p class="greeting">Hello <strong>${name}</strong>,</p>
          <p class="desc">Please use the following 6-digit One-Time Password (OTP) to securely verify your email address and access your Property Adda client account. This OTP is valid for 10 minutes.</p>
          <div class="otp-box">${otp}</div>
          <p class="desc" style="font-size: 12px; color: #64748B;">Please copy or enter this OTP on the verification screen to proceed. If you did not request this verification code, please ignore this email or contact support.</p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Property Adda India. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER || process.env.SMTP_USER || 'noreply@property-adda.com';
    const info = await transporter.sendMail({
      from: `"Property Adda" <${fromAddress}>`,
      to: email,
      subject: `${otp} is your Property Adda verification code`,
      html: htmlContent,
    });
    console.log(`✅ Real OTP email successfully delivered via SMTP to: ${email} (MessageID: ${info.messageId})`);
    return { sent: true, mode: 'smtp', messageId: info.messageId };
  } catch (error) {
    console.error(`❌ SMTP delivery to ${email} failed:`, error.message);
    return { sent: false, mode: 'error', error: error.message };
  }
};
