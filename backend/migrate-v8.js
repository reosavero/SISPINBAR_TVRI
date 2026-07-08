// ============================================
// MIGRATION v8: Add 'Ditolak' status & catatan_admin to pengembalian
// ============================================

const fs = require('fs');
const path = require('path');
const pool = require('./config/db');

async function migrate() {
  console.log('🚀 Running Migration v8: Pengembalian Reject Feature...\n');

  try {
    // 1. Modify pengembalian status ENUM to include 'Ditolak'
    console.log('📋 Step 1: Updating pengembalian status ENUM...');
    await pool.execute(`
      ALTER TABLE pengembalian
      MODIFY COLUMN status ENUM('Menunggu Konfirmasi', 'Diterima', 'Ditolak') DEFAULT 'Menunggu Konfirmasi'
    `);
    console.log('✅ pengembalian.status ENUM updated (added Ditolak)');

    // 2. Add catatan_admin column
    console.log('\n📋 Step 2: Adding catatan_admin column...');
    try {
      await pool.execute(`
        ALTER TABLE pengembalian
        ADD COLUMN catatan_admin TEXT DEFAULT NULL
        AFTER catatan
      `);
      console.log('✅ catatan_admin column added');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('⏭️  catatan_admin column already exists, skipping...');
      } else {
        throw err;
      }
    }

    console.log('\n✅ Migration v8 completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration v8 failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

migrate();