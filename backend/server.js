// ============================================
// SERVER - Sistem Peminjaman Barang TVRI
// ============================================

require('dotenv').config();
const app = require('./app');
const { cleanupOldLogs } = require('./services/auditCleanupService');

const PORT = process.env.PORT || 5000;

// ========== SCHEDULED: Auto cleanup audit logs daily at 00:00 ==========
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Calculate ms until next midnight
const now = new Date();
const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
const msUntilMidnight = midnight.getTime() - now.getTime();

// First run at next midnight, then every 24 hours
setTimeout(() => {
  console.log('[SCHEDULER] 🧹 Running daily audit log cleanup...');
  cleanupOldLogs({ username: 'auto-scheduler' })
    .then(result => {
      if (result.deleted > 0) {
        console.log(`[SCHEDULER] ✅ Cleaned ${result.deleted} old audit logs (retention: ${result.retentionDays} days)`);
      } else {
        console.log('[SCHEDULER] ✅ No old audit logs to clean');
      }
    })
    .catch(err => console.error('[SCHEDULER] ❌ Audit cleanup error:', err.message));

  // Schedule recurring every 24 hours
  setInterval(() => {
    console.log('[SCHEDULER] 🧹 Running daily audit log cleanup...');
    cleanupOldLogs({ username: 'auto-scheduler' })
      .then(result => {
        if (result.deleted > 0) {
          console.log(`[SCHEDULER] ✅ Cleaned ${result.deleted} old audit logs (retention: ${result.retentionDays} days)`);
        } else {
          console.log('[SCHEDULER] ✅ No old audit logs to clean');
        }
      })
      .catch(err => console.error('[SCHEDULER] ❌ Audit cleanup error:', err.message));
  }, ONE_DAY_MS);
}, msUntilMidnight);

console.log(`[SCHEDULER] 🕐 Audit cleanup scheduled at 00:00 daily (next run in ${Math.round(msUntilMidnight / 3600000)}h ${Math.round((msUntilMidnight % 3600000) / 60000)}m)`);

app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════════╗
  ║                                                  ║
  ║    🏢 SISPINBAR - TVRI Jawa Timur               ║
  ║    📡 Sistem Peminjaman Barang                   ║
  ║                                                  ║
  ║    🌐 Server running on port ${PORT}               ║
  ║    🔗 http://localhost:${PORT}                      ║
  ║    📊 API: http://localhost:${PORT}/api/health      ║
  ║                                                  ║
  ╚══════════════════════════════════════════════════╝
  `);
});