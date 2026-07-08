// ============================================
// EMAIL VERIFY SERVICE - Sistem Peminjaman Barang TVRI
// Verifies email domain has valid MX records
// Blocks disposable/temporary email domains
// ============================================

const dns = require('dns').promises;

// ========== DISPOSABLE EMAIL DOMAINS ==========
const DISPOSABLE_DOMAINS = new Set([
  // Common disposable email services
  'tempmail.com', 'temp-mail.org', 'temp-mail.com', 'temporary-mail.com',
  'throwaway.email', 'throwawaymail.com', 'disposable.email',
  'mailinator.com', 'maildrop.cc', 'maildrop.com', 'guerrillamail.com',
  'guerrillamail.info', 'guerrillamail.org', 'guerrillamailblock.com',
  'sharklasers.com', 'grr.la', 'guerrillamail.biz', 'guerrillamail.de',
  'guerrillamail.net', 'guerrillamailblock.com', 'spam4.me',
  'yopmail.com', 'yopmail.fr', 'yopmail.net', 'yopmail.org',
  'jetable.org', 'jetable.com', 'jetable.fr',
  'trashmail.com', 'trashmail.net', 'trashmail.org', 'trash-mail.com',
  'fakeinbox.com', 'fakeinbox.org', 'mailcatch.com', 'mailcatch.org',
  '10minutemail.com', '10minutemail.net', '20minutemail.com',
  '30minutemail.com', 'minuteinbox.com', 'emailondeck.com',
  'tempail.com', 'tempmailo.com', 'tempmailgen.com', 'tempmails.com',
  'tempr.email', 'tempmailaddress.com', 'tempmaildomain.com',
  'mailnesia.com', 'mailnull.com', 'mailshell.com', 'mailslite.com',
  'mohmal.com', 'mohmal.org', 'mytemp.email', 'mytempemail.com',
  'no-ux.com', 'objectmail.com', 'proxymail.eu', 'rcpt.at',
  'reallymymail.com', 'receiveee.com', 'recyclemail.de', 'regbypass.com',
  'rmqkr.net', 'royal.net', 's0ny.net', 'safe-mail.net',
  'saynotospam.com', 'scbox.one', 'scbox.one', 'schafmail.de',
  'selfdestructingmail.com', 'sendspamhere.com', 'shitmail.me',
  'shitmail.org', 'slippery.email', 'slaskpost.se', 'smellrear.com',
  'smtp.bid', 'snakkit.com', 'sofimail.com', 'spamgourmet.com',
  'spamgourmet.net', 'spamgourmet.org', 'squizzy.com', 'sry.li',
  'storiqax.xyz', 'superrito.com', 'teflon.com', 'teleworm.com',
  'teleworm.us', 'tfwno.gf', 'thrott.com', 'throwam.com',
  'throwawaymail.com', 'throwawaymail.org', 'tilien.com', 'timgi.com',
  'tinoza.org', 'tkitc.com', 'tlhao.org', 'tmpmail.net',
  'tmpmail.org', 'tom7mai.com', 'top1mail.ru', 'topmail2.com',
  'trashymail.com', 'trashymail.net', 'trbvm.com', 'trbvn.com',
  'tuketi.com', 'tutanota.com', 'tutuapp.bid', 'tvchd.com',
  'uemail.me', 'umail.net', 'unids1.com', 'unmail.ru',
  'urhen.com', 'usharedmail.com', 'uxsolutions.com', 'vaati.org',
  'vidchart.com', 'vipmail.name', 'vipmail.org', 'vkcode.ru',
  'walala.org', 'walkmail.net', 'walkmail.ru', 'web-ideal.fr',
  'webmail24.top', 'wimsg.com', 'wmail.club', 'wsym.am',
  'x24.com', 'xagloo.co', 'xcoxc.com', 'xents.com',
  'xmail.com', 'xnms.ga', 'xoixa.com', 'xtmail.com',
  'xvcbv.com', 'xxlnk.com', 'xyzfree.net', 'yach.voyage',
  'yadi.sk', 'yamail.ru', 'yandere.click', 'ycn.ro',
  'ye.vc', 'yellowdev.com', 'yert.ye', 'yopmail.fr',
  'yopmail.net', 'yopmail.org', 'you-spam.com', 'youmail.ga',
  'youmailr.com', 'yxzx868.com', 'z1p.biz', 'z5.ga',
  'zact.site', 'zaine.net', 'zasod.com', 'ze.tc',
  'zebins.com', 'zebins.eu', 'zehnminutenmail.de', 'zemo9.com',
  'zepp.dk', 'zipsendtest.com', 'zoaxe.com', 'zomg.info',
  // Add more as needed
]);

// ========== CACHE MX LOOKUP RESULTS ==========
const mxCache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// ========== VERIFY EMAIL ==========
const verifyEmail = async (email) => {
  // Basic format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return { valid: false, reason: 'Format email tidak valid' };
  }

  const domain = email.split('@')[1].toLowerCase().trim();

  // Check disposable domain
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { valid: false, reason: 'Email sementara/disposable tidak diperbolehkan. Gunakan email permanen.' };
  }

  // Check common typos
  const typoSuggestion = getTypoSuggestion(domain);
  if (typoSuggestion) {
    return { valid: false, reason: `Domain email tidak valid. Apakah maksud Anda ${typoSuggestion}?` };
  }

  // Check MX records (with cache)
  const cachedResult = mxCache.get(domain);
  if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_TTL) {
    if (!cachedResult.hasMx) {
      return { valid: false, reason: 'Domain email tidak memiliki server email (MX record). Email tidak dapat menerima pesan.' };
    }
    return { valid: true, reason: 'Email valid' };
  }

  try {
    const mxRecords = await dns.resolveMx(domain);
    const hasMx = mxRecords && mxRecords.length > 0;

    // Cache the result
    mxCache.set(domain, { hasMx, timestamp: Date.now() });

    if (!hasMx) {
      return { valid: false, reason: 'Domain email tidak memiliki server email (MX record). Email tidak dapat menerima pesan.' };
    }

    return { valid: true, reason: 'Email valid' };
  } catch (err) {
    // DNS resolution failed - domain likely doesn't exist
    if (err.code === 'ENOTFOUND' || err.code === 'ENODATA') {
      mxCache.set(domain, { hasMx: false, timestamp: Date.now() });
      return { valid: false, reason: 'Domain email tidak ditemukan. Periksa kembali alamat email Anda.' };
    }

    // Timeout or other DNS errors - allow through but suggest checking
    console.warn(`[EMAIL_VERIFY] DNS lookup error for ${domain}: ${err.code || err.message}`);
    return { valid: true, reason: 'Tidak dapat memverifikasi domain email. Pastikan email Anda benar.', warning: true };
  }
};

// ========== COMMON TYPO SUGGESTIONS ==========
const DOMAIN_TYPOS = {
  'gmial.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.om': 'gmail.com',
  'gmaiil.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gmail.comm': 'gmail.com',
  'gmailcom': 'gmail.com',
  'hotmal.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'hotmil.com': 'hotmail.com',
  'hotmail.co': 'hotmail.com',
  'hotrmail.com': 'hotmail.com',
  'yaho.com': 'yahoo.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yahoo.co': 'yahoo.com',
  'outloo.com': 'outlook.com',
  'outlok.com': 'outlook.com',
  'outlook.co': 'outlook.com',
};

const getTypoSuggestion = (domain) => {
  return DOMAIN_TYPOS[domain] || null;
};

module.exports = { verifyEmail, DISPOSABLE_DOMAINS };