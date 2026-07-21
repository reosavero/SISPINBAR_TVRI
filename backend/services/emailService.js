

const nodemailer = require('nodemailer');
const pool = require('../config/db');

const getDefaultTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: parseInt(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  });
};

const getFromEmail = () => {
  return process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@tvrijatim.go.id';
};

const getAppName = () => {
  return process.env.APP_NAME || 'SISPINBAR - TVRI Jawa Timur';
};

const getSmtpConfig = async () => {
  try {
    const [rows] = await pool.execute(
      "SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from', 'app_name')"
    );
    const config = {};
    rows.forEach(row => {
      config[row.setting_key] = row.setting_value;
    });
    return config;
  } catch {
    return {};
  }
};

const buildTransporter = async () => {
  const dbConfig = await getSmtpConfig();

  const host = dbConfig.smtp_host || process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(dbConfig.smtp_port) || parseInt(process.env.SMTP_PORT) || 587;
  const user = dbConfig.smtp_user || process.env.SMTP_USER || '';
  const pass = dbConfig.smtp_pass || process.env.SMTP_PASS || '';

  if (!user || !pass) {
    console.warn('[EMAIL] SMTP credentials not configured. Email will not be sent.');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
};

const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = await buildTransporter();
    if (!transporter) {
      console.warn('[EMAIL] No transporter available. Skipping email.');
      return { sent: false, reason: 'SMTP not configured' };
    }

    const dbConfig = await getSmtpConfig();
    const fromEmail = dbConfig.smtp_from || getFromEmail();
    const appName = dbConfig.app_name || getAppName();

    const info = await transporter.sendMail({
      from: `"${appName}" <${fromEmail}>`,
      to,
      subject,
      html,
    });

    console.log(`[EMAIL] Sent to ${to}: ${subject} (ID: ${info.messageId})`);
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EMAIL] Error sending email:', error.message);
    return { sent: false, reason: error.message };
  }
};

const sendApprovalEmail = async (userEmail, userName, username) => {
  const appName = getAppName();
  const subject = `${appName} - Registrasi Disetujui`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f7fa; }
        .container { max-width: 560px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #005BAC, #003B71); padding: 28px 32px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; }
        .content { padding: 28px 32px; }
        .greeting { font-size: 16px; color: #1f2937; margin-bottom: 16px; }
        .message { font-size: 14px; color: #4b5563; line-height: 1.7; margin-bottom: 20px; }
        .info-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px 20px; margin-bottom: 20px; }
        .info-box .label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .info-box .value { font-size: 15px; color: #1f2937; font-weight: 600; }
        .button { display: inline-block; background: linear-gradient(135deg, #005BAC, #003B71); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; margin-top: 8px; }
        .footer { background: #f9fafb; padding: 16px 32px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Registrasi Disetujui</h1>
        </div>
        <div class="content">
          <p class="greeting">Halo, <strong>${userName}</strong>!</p>
          <p class="message">
            Selamat! Registrasi akun Anda pada <strong>${appName}</strong> telah <strong style="color: #16a34a;">disetujui</strong> oleh administrator. 
            Anda sekarang dapat masuk ke sistem menggunakan akun berikut:
          </p>
          <div class="info-box">
            <div class="label">Username</div>
            <div class="value">@${username}</div>
          </div>
          <p class="message">
            Silakan login dengan username dan password yang Anda daftarkan untuk mulai menggunakan sistem.
          </p>
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="button">Masuk Sekarang</a>
          </div>
        </div>
        <div class="footer">
          ${appName} — Sistem Peminjaman Barang TVRI Jawa Timur<br>
          Email ini dikirim otomatis. Mohon tidak membalas email ini.
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: userEmail, subject, html });
};

const sendRejectionEmail = async (userEmail, userName, reason) => {
  const appName = getAppName();
  const subject = `${appName} - Registrasi Ditolak`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f7fa; }
        .container { max-width: 560px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #dc2626, #991b1b); padding: 28px 32px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; }
        .content { padding: 28px 32px; }
        .greeting { font-size: 16px; color: #1f2937; margin-bottom: 16px; }
        .message { font-size: 14px; color: #4b5563; line-height: 1.7; margin-bottom: 20px; }
        .reason-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px 20px; margin-bottom: 20px; }
        .reason-box .label { font-size: 12px; color: #991b1b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; font-weight: 600; }
        .reason-box .value { font-size: 14px; color: #1f2937; line-height: 1.6; }
        .footer { background: #f9fafb; padding: 16px 32px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>❌ Registrasi Ditolak</h1>
        </div>
        <div class="content">
          <p class="greeting">Halo, <strong>${userName}</strong>,</p>
          <p class="message">
            Mohon maaf, registrasi akun Anda pada <strong>${appName}</strong> telah <strong style="color: #dc2626;">ditolak</strong> oleh administrator.
          </p>
          ${reason ? `
          <div class="reason-box">
            <div class="label">Alasan Penolakan</div>
            <div class="value">${reason}</div>
          </div>
          ` : ''}
          <p class="message">
            Jika Anda merasa ini adalah kesalahan atau ingin mendaftar ulang, silakan hubungi administrator TVRI Jawa Timur.
          </p>
        </div>
        <div class="footer">
          ${appName} — Sistem Peminjaman Barang TVRI Jawa Timur<br>
          Email ini dikirim otomatis. Mohon tidak membalas email ini.
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: userEmail, subject, html });
};

module.exports = {
  sendEmail,
  sendApprovalEmail,
  sendRejectionEmail,
};