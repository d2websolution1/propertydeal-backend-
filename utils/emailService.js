// Backend/utils/emailService.js
import nodemailer from 'nodemailer';
import { Resend } from 'resend';

// Initialize Resend instance if API key is present
const getResendClient = () => {
  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  if (apiKey) {
    return new Resend(apiKey);
  }
  return null;
};

/**
 * Build nodemailer transporter with support for:
 * 1. Hostinger SMTP (smtp.hostinger.com:465)
 * 2. Gmail SMTP (smtp.gmail.com:465 or service: 'gmail')
 * 3. Custom SMTP (SMTP_HOST, SMTP_PORT, etc.)
 */
export const createTransporter = () => {
  const user = (process.env.EMAIL_USER || process.env.SMTP_USER || '').trim();
  const pass = (process.env.EMAIL_PASS || process.env.SMTP_PASS || '').trim();
  const host = (process.env.SMTP_HOST || process.env.EMAIL_HOST || '').trim();

  if (user && pass) {
    if (host) {
      const port = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT) || 465;
      const secure = process.env.SMTP_SECURE !== undefined
        ? (String(process.env.SMTP_SECURE).toLowerCase() === 'true')
        : (port === 465);

      return nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
      });
    }

    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
    });
  }

  if (host) {
    return nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || process.env.EMAIL_PORT) || 587,
      secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
      tls: { rejectUnauthorized: false },
    });
  }

  return null;
};

/**
 * Diagnostic helper to check current Email / SMTP configuration status
 */
export const getEmailConfigStatus = () => {
  const resendKey = (process.env.RESEND_API_KEY || '').trim();
  if (resendKey) {
    const maskedKey = resendKey.substring(0, 6) + '...' + resendKey.substring(Math.max(0, resendKey.length - 4));
    return {
      configured: true,
      service: 'Resend API',
      apiKey: maskedKey,
      fromEmail: process.env.RESEND_FROM || process.env.EMAIL_FROM || 'Property Adda <noreply@property-adda.com>',
      instructions: 'Resend API is active. Ready to deliver live OTP verification emails.',
    };
  }

  const user = (process.env.EMAIL_USER || process.env.SMTP_USER || '').trim();
  const pass = (process.env.EMAIL_PASS || process.env.SMTP_PASS || '').trim();
  const host = (process.env.SMTP_HOST || process.env.EMAIL_HOST || '').trim();
  const isConfigured = Boolean(user && pass);

  return {
    configured: isConfigured,
    service: host ? `SMTP (${host})` : (user ? 'Gmail Service' : 'None'),
    fromEmail: user ? user.replace(/(.{2})(.*)(@.*)/, '$1***$3') : 'Not Set',
    instructions: isConfigured
      ? 'Email service is active and ready to deliver real OTPs.'
      : 'Set RESEND_API_KEY (or EMAIL_USER & EMAIL_PASS) in Hostinger / Environment Variables.',
  };
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
          <p class="desc">Please use the following 6-digit One-Time Password (OTP) to securely verify your Gmail address and complete your account creation on Property Adda. This OTP is valid for 10 minutes.</p>
          <div class="otp-box">${otp}</div>
          <p class="desc" style="font-size: 12px; color: #64748B;">Please enter this OTP on the registration screen to complete your account setup. If you did not request this verification code, please ignore this email.</p>
        </div>
        <div class="footer">
          &copy; 2020 Property Adda. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  // 1. Check if Resend is configured (Primary)
  const resend = getResendClient();
  let resendFailed = false;
  let resendErrorMessage = '';

  if (resend) {
    try {
      const fromEmail = process.env.RESEND_FROM || process.env.EMAIL_FROM || 'Property Adda <noreply@property-adda.com>';
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: [email],
        subject: `${otp} is your Property Adda verification code`,
        html: htmlContent,
      });

      if (error) {
        console.error('❌ Resend API Error:', error);
        resendFailed = true;
        resendErrorMessage = error.message || JSON.stringify(error);
      } else if (data?.id) {
        console.log(`✅ Real OTP email successfully delivered via Resend to: ${email} (ID: ${data.id})`);
        return { sent: true, mode: 'resend', messageId: data.id };
      }
    } catch (err) {
      console.error('❌ Resend Exception:', err.message);
      resendFailed = true;
      resendErrorMessage = err.message;
    }
  }

  // 2. Fallback to Nodemailer SMTP (Hostinger or Gmail) if Resend failed or not set
  const transporter = createTransporter();

  if (transporter) {
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
      console.error(`❌ SMTP fallback delivery to ${email} failed:`, error.message);
      if (resendFailed) {
        return { sent: false, mode: 'both_failed', error: `Resend: ${resendErrorMessage} | SMTP: ${error.message}` };
      }
      return { sent: false, mode: 'smtp_error', error: error.message };
    }
  }

  // If Resend failed and no SMTP configured
  if (resendFailed) {
    return {
      sent: false,
      mode: 'resend_error',
      error: resendErrorMessage,
    };
  }

  // If neither Resend nor SMTP is configured
  console.warn(`⚠️ [Email Notice]: RESEND_API_KEY or SMTP credentials not set in environment.`);
  console.warn(`   Configure RESEND_API_KEY in Hostinger Environment Variables to send live emails to inboxes.`);
  return {
    sent: false,
    mode: 'unconfigured',
    message: 'Email service credentials (RESEND_API_KEY) not configured in environment',
  };
};
