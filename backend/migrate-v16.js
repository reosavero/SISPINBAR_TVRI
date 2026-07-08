// ============================================
// Migration v16: Unique index on barang.nama_barang
// ============================================

const pool = require('./config/db');

async function migrate() {
  console.log('Running migration v16: barang.nama_barang unique index...');
  
  try {
    await pool.execute(`
      CREATE UNIQUE INDEX uk_barang_nama_barang ON barang(nama_barang)
    `);
    console.log('✅ Unique index uk_barang_nama_barang created on barang.nama_barang');
  } catch (err) {
    if (err.code === 'ER_DUP_KEYNAME') {
      console.log('⚠️  Index uk_barang_nama_barang already exists, skipping...');
    } else if (err.code === 'ER_DUP_ENTRY') {
      console.log('⚠️  Duplicate nama_barang values exist. Please resolve duplicates before creating unique index.');
      console.log('Error:', err.message);
    } else {
      console.error('❌ Migration v16 failed:', err.message);
      throw err;
    }
  }

  console.log('Migration v16 completed.');
  process.exit(0);
}

migrate();