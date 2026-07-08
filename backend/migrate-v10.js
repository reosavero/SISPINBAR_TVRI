// ============================================
// MIGRATION v10: Add unique constraint on kategori.nama
// ============================================

const pool = require('./config/db');

async function migrate() {
  console.log('Running migration v10: Add unique constraint on kategori.nama...');

  try {
    // Check if unique index already exists
    const [indexes] = await pool.execute(
      "SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'kategori' AND INDEX_NAME = 'uk_kategori_nama'"
    );

    if (indexes.length > 0) {
      console.log('  ✓ Unique index uk_kategori_nama already exists, skipping');
    } else {
      await pool.execute('ALTER TABLE kategori ADD UNIQUE INDEX uk_kategori_nama (nama)');
      console.log('  ✓ Added unique index uk_kategori_nama on kategori.nama');
    }

    console.log('Migration v10 completed successfully!');
  } catch (error) {
    // If duplicate values exist, provide guidance
    if (error.code === 'ER_DUP_ENTRY') {
      console.error('  ❌ Cannot add unique index: duplicate kategori names exist.');
      console.error('  Please resolve duplicates first:');
      console.error('  SELECT nama, COUNT(*) AS cnt FROM kategori GROUP BY nama HAVING cnt > 1;');
      throw error;
    }
    console.error('Migration v10 error:', error.message);
    throw error;
  }
}

migrate()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));