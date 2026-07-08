// ============================================
// DATABASE INIT - Sistem Peminjaman Barang TVRI
// ============================================
// Script ini HANYA membuat struktur tabel dan mengisi data awal
// (admin, kategori, barang). Data pegawai dan peminjaman
// yang sudah ada TIDAK akan dihapus.
//
// ⚠️  JANGAN gunakan script ini untuk reset database.
// ⚠️  Jika ingin reset, lakukan manual melalui phpMyAdmin.
// ============================================

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDatabase() {
  console.log('🔧 Initializing database...\n');

  // First connect without database to create it
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  try {
    // Read and execute schema
    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    const schemaStatements = schemaSQL.split(';').filter(s => s.trim());
    
    for (const statement of schemaStatements) {
      if (statement.trim()) {
        try {
          await connection.execute(statement);
        } catch (err) {
          // Ignore "already exists" errors
          if (!err.message.includes('already exists')) {
            console.log(`⚠️ Schema warning: ${err.message}`);
          }
        }
      }
    }
    console.log('✅ Schema created/verified successfully');

    // Read and execute seed data (uses ON DUPLICATE KEY UPDATE - safe to re-run)
    const seedPath = path.join(__dirname, 'database', 'seed.sql');
    const seedSQL = fs.readFileSync(seedPath, 'utf8');
    const seedStatements = seedSQL.split(';').filter(s => s.trim());
    
    for (const statement of seedStatements) {
      if (statement.trim()) {
        try {
          await connection.execute(statement);
        } catch (err) {
          if (!err.message.includes('Duplicate entry')) {
            console.log(`⚠️ Seed warning: ${err.message}`);
          }
        }
      }
    }
    console.log('✅ Seed data inserted successfully');

    console.log('\n🎉 Database initialization complete!');
    console.log('📊 You can now start the server with: npm run dev\n');
    console.log('🔑 Login credentials:');
    console.log('   Super Admin:');
    console.log('      Username: superadmin');
    console.log('      Password: superadmin123');
    console.log('   Admin:');
    console.log('      Username: admin');
    console.log('      Password: admin123\n');
    console.log('⚠️  Note: Data pegawai yang sudah ada TIDAK terhapus.');
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
  } finally {
    await connection.end();
  }
}

initDatabase();