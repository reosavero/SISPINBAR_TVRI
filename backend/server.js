// ============================================
// SERVER - Sistem Peminjaman Barang TVRI
// ============================================

require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5000;

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