// ============================================
// MIGRATION v15: Lokasi nama_lokasi unique index
// ============================================

const pool = require('./config/db');

async function migrate() {
  console.log('🔄 Running Migration v15: Lokasi nama_lokasi unique index...');

  try {
    // Check for duplicates first
    const [duplicates] = await pool.execute(`
      SELECT nama_lokasi, COUNT(*) AS cnt
      FROM lokasi
      WHERE deleted_at IS NULL
      GROUP BY nama_lokasi
      HAVING cnt > 1
    `);

    if (duplicates.length > 0) {
      console.log(`⚠️  Found ${duplicates.length} duplicate nama_lokasi. Resolving...`);
      for (const dup of duplicates) {
        const [rows] = await pool.execute(
          'SELECT id FROM lokasi WHERE nama_lokasi = ? AND deleted_at IS NULL ORDER BY id ASC',
          [dup.nama_lokasi]
        );
        // Keep the first, rename the rest
        for (let i = 1; i < rows.length; i++) {
          const newName = `${dup.nama_lokasi} (${i + 1})`;
          await pool.execute('UPDATE lokasi SET nama_lokasi = ? WHERE id = ?', [newName, rows[i].id]);
          console.log(`  Renamed lokasi id=${rows[i].id}: "${dup.nama_lokasi}" → "${newName}"`);
        }
      }
    }

    // Add unique index
    await pool.execute(`
      CREATE UNIQUE INDEX uk_lokasi_nama_lokasi ON lokasi (nama_lokasi)
    `);
    console.log('✅ Unique index uk_lokasi_nama_lokasi created on lokasi.nama_lokasi');

    console.log('✅ Migration v15 completed successfully!');
  } catch (err) {
    if (err.code === 'ER_DUP_KEYNAME') {
      console.log('⚠️  Index uk_lokasi_nama_lokasi already exists, skipping.');
    } else {
      console.error('❌ Migration v15 failed:', err.message);
      throw err;
    }
  }
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });