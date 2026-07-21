

const pool = require('../config/db');
const emailService = require('./emailService');
const { verifyEmail } = require('./emailVerifyService');

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 3;
const OTP_RESEND_COOLDOWN_SECONDS = 60;

const generateOtp = () => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < OTP_LENGTH; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
};

const sendOtp = async (email) => {
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.trim())) {
    throw new Error('Format email tidak valid');
  }

  const trimmedEmail = email.trim().toLowerCase();

  
  const emailCheck = await verifyEmail(trimmedEmail);
  if (!emailCheck.valid) {
    throw new Error(emailCheck.reason);
  }

  
  const [existing] = await pool.execute(
    'SELECT id FROM users WHERE email = ? AND deleted_at IS NULL',
    [trimmedEmail]
  );
  if (existing.length > 0) {
    throw new Error('Email sudah terdaftar. Silakan gunakan email lain.');
  }

  
  const [recentOtp] = await pool.execute(
    'SELECT id, created_at FROM email_verifications WHERE email = ? AND created_at > DATE_SUB(NOW(), INTERVAL ? SECOND) ORDER BY created_at DESC LIMIT 1',
    [trimmedEmail, OTP_RESEND_COOLDOWN_SECONDS]
  );
  if (recentOtp.length > 0) {
    const secondsAgo = Math.floor((Date.now() - new Date(recentOtp[0].created_at).getTime()) / 1000);
    const remainingSeconds = OTP_RESEND_COOLDOWN_SECONDS - secondsAgo;
    throw new Error(`Tunggu ${remainingSeconds} detik sebelum mengirim ulang kode verifikasi`);
  }

  
  await pool.execute(
    'UPDATE email_verifications SET verified = -1 WHERE email = ? AND verified = 0',
    [trimmedEmail]
  );

  
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  
  await pool.execute(
    'INSERT INTO email_verifications (email, otp_code, expires_at) VALUES (?, ?, ?)',
    [trimmedEmail, otp, expiresAt]
  );

  
  const appName = process.env.APP_NAME || 'SISPINBAR - TVRI Jawa Timur';
  const subject = `${appName} - Kode Verifikasi Email`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f7fa; }
        .container { max-width: 480px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #005BAC, #003B71); padding: 24px 28px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 18px; font-weight: 700; }
        .content { padding: 28px 28px; }
        .greeting { font-size: 15px; color: #1f2937; margin-bottom: 12px; }
        .message { font-size: 13px; color: #4b5563; line-height: 1.7; margin-bottom: 20px; }
        .otp-box { background: linear-gradient(135deg, #f0f7ff, #e0efff); border: 2px dashed #005BAC; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px; }
        .otp-label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
        .otp-code { font-size: 36px; font-weight: 800; color: #005BAC; letter-spacing: 8px; font-family: 'Courier New', monospace; }
        .expiry { font-size: 12px; color: #9ca3af; margin-top: 8px; }
        .warning { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; }
        .warning p { font-size: 12px; color: #92400e; margin: 0; }
        .footer { background: #f9fafb; padding: 14px 28px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Verifikasi Email</h1>
        </div>
        <div class="content">
          <p class="greeting">Halo!</p>
          <p class="message">
            Anda sedang melakukan registrasi akun di <strong>${appName}</strong>. 
            Masukkan kode verifikasi berikut untuk melanjutkan:
          </p>
          <div class="otp-box">
            <div class="otp-label">Kode Verifikasi</div>
            <div class="otp-code">${otp}</div>
            <div class="expiry">Berlaku selama ${OTP_EXPIRY_MINUTES} menit</div>
          </div>
          <div class="warning">
            <p>⚠️ Jangan bagikan kode ini kepada siapapun. Jika Anda tidak merasa melakukan registrasi, abaikan email ini.</p>
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

  const result = await emailService.sendEmail({ to: trimmedEmail, subject, html });

  return {
    sent: result.sent,
    message: result.sent
      ? `Kode verifikasi telah dikirim ke ${trimmedEmail}`
      : `Gagal mengirim kode verifikasi: ${result.reason}`,
    expiryMinutes: OTP_EXPIRY_MINUTES,
    cooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS,
  };
};

const verifyOtp = async (email, otp) => {
  const trimmedEmail = email.trim().toLowerCase();

  
  const [records] = await pool.execute(
    `SELECT id, otp_code, attempts, verified, expires_at FROM email_verifications 
     WHERE email = ? AND verified = 0 AND expires_at > NOW() 
     ORDER BY created_at DESC LIMIT 1`,
    [trimmedEmail]
  );

  if (records.length === 0) {
    
    const [expired] = await pool.execute(
      `SELECT id FROM email_verifications WHERE email = ? AND verified = 0 ORDER BY created_at DESC LIMIT 1`,
      [trimmedEmail]
    );
    if (expired.length > 0) {
      throw new Error('Kode verifikasi sudah kedaluwarsa. Silakan kirim ulang kode baru.');
    }
    throw new Error('Kode verifikasi tidak valid. Silakan kirim ulang kode verifikasi.');
  }

  const record = records[0];

  
  if (record.attempts >= MAX_OTP_ATTEMPTS) {
    
    await pool.execute(
      'UPDATE email_verifications SET verified = -1 WHERE id = ?',
      [record.id]
    );
    throw new Error(`Terlalu banyak percobaan salah. Silakan kirim ulang kode verifikasi baru.`);
  }

  
  await pool.execute(
    'UPDATE email_verifications SET attempts = attempts + 1 WHERE id = ?',
    [record.id]
  );

  
  if (record.otp_code !== otp) {
    const remaining = MAX_OTP_ATTEMPTS - (record.attempts + 1);
    throw new Error(`Kode verifikasi salah. Sisa percobaan: ${remaining} kali.`);
  }

  
  await pool.execute(
    'UPDATE email_verifications SET verified = 1, attempts = attempts + 1 WHERE id = ?',
    [record.id]
  );

  
  await pool.execute(
    'UPDATE email_verifications SET verified = -1 WHERE email = ? AND id != ? AND verified = 0',
    [trimmedEmail, record.id]
  );

  return { verified: true, message: 'Email berhasil diverifikasi' };
};

const isEmailVerified = async (email) => {
  const trimmedEmail = email.trim().toLowerCase();

  const [records] = await pool.execute(
    `SELECT id FROM email_verifications 
     WHERE email = ? AND verified = 1 AND expires_at > DATE_SUB(NOW(), INTERVAL 30 MINUTE)
     ORDER BY created_at DESC LIMIT 1`,
    [trimmedEmail]
  );

  return records.length > 0;
};

const cleanupExpired = async () => {
  const [result] = await pool.execute(
    'DELETE FROM email_verifications WHERE expires_at < NOW() - INTERVAL 1 HOUR'
  );
  return result.affectedRows;
};

module.exports = {
  sendOtp,
  verifyOtp,
  isEmailVerified,
  cleanupExpired,
  OTP_EXPIRY_MINUTES,
  OTP_RESEND_COOLDOWN_SECONDS,
  MAX_OTP_ATTEMPTS,
};