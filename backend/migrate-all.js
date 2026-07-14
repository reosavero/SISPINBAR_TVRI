// ============================================
// MIGRATE ALL - SISPINBAR Database Setup
// Menjalankan schema.sql + seed super admin
// AMAN dijalankan berulang kali (idempotent)
//
// Cara menjalankan:
//   npm run migrate
//   ATAU
//   node migrate-all.js
// ============================================

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true,
};

const DB_NAME = process.env.DB_NAME || 'db_peminjaman_tvri';

async function migrate() {
  console.log('');
  console.log('  ╔══════════════════════════════════════════════════╗');
  console.log('  ║  🏗️  SISPINBAR - Database Migration (All-in-One) ║');
  console.log('  ╚══════════════════════════════════════════════════╝');
  console.log('');

  let connection;
  try {
    // 1. Connect to MySQL (tanpa database dulu untuk create DB)
    console.log('  📡 Connecting to MySQL...');
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('  ✅ Connected to MySQL');

    // 2. Create database if not exists
    console.log(`  📦 Ensuring database "${DB_NAME}" exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.query(`USE \`${DB_NAME}\``);
    console.log('  ✅ Database ready');

    // 3. Check if tables already exist (skip if fresh install)
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    const isFreshInstall = !tableNames.includes('users');

    if (isFreshInstall) {
      console.log('  🆕 Fresh install detected — running full schema...');
    } else {
      console.log('  🔄 Existing database detected — checking schema integrity...');
    }

    // 4. Run schema.sql (CREATE TABLE IF NOT EXISTS — idempotent)
    console.log('  📄 Running schema.sql...');
    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    // Run entire schema with multipleStatements enabled
    try {
      await connection.query(schemaSQL);
      console.log('  ✅ Schema applied');
    } catch (err) {
      // If multipleStatements fails, try running individual CREATE TABLE statements
      console.log('  ⚠️  Full schema failed, running individual statements...');
      const tableStatements = [
        'CREATE DATABASE IF NOT EXISTS `' + DB_NAME + '`',
        'USE `' + DB_NAME + '`',
      ];
      
      // Extract CREATE TABLE blocks
      const createTableRegex = /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+[\s\S]*?\)\s*ENGINE/gi;
      const matches = schemaSQL.match(createTableRegex) || [];
      for (const stmt of matches) {
        try {
          await connection.query(stmt);
        } catch (e) {
          if (e.code !== 'ER_TABLE_EXISTS_ERROR') console.log(`  ⚠️  ${e.message.substring(0, 80)}`);
        }
      }
      
      // Extract INSERT IGNORE/ON DUPLICATE statements
      const insertRegex = /INSERT[\s\S]*?;(?=\s*(?:SELECT|INSERT|$))/gi;
      const insertMatches = schemaSQL.match(insertRegex) || [];
      for (const stmt of insertMatches) {
        try {
          await connection.query(stmt.replace(/;$/, ''));
        } catch (e) { /* ignore */ }
      }
      
      // Run the final SELECT
      console.log('  ✅ Schema applied (individual statements)');
    }

    // 5. Ensure all columns exist (idempotent ALTER TABLE for upgrades from old schema)
    const alterStatements = [
      // v6: is_active, deleted_at (already in schema, but ensure for upgrades)
      { table: 'users', column: 'is_active', check: 'TINYINT(1)', sql: "ALTER TABLE users ADD COLUMN is_active TINYINT(1) DEFAULT 1 AFTER role" },
      { table: 'users', column: 'deleted_at', check: 'datetime', sql: "ALTER TABLE users ADD COLUMN deleted_at DATETIME NULL AFTER is_active" },
      // v9: login_attempts, locked_until
      { table: 'users', column: 'login_attempts', check: 'int', sql: "ALTER TABLE users ADD COLUMN login_attempts INT DEFAULT 0 COMMENT 'Jumlah percobaan login gagal'" },
      { table: 'users', column: 'locked_until', check: 'datetime', sql: "ALTER TABLE users ADD COLUMN locked_until DATETIME NULL COMMENT 'Waktu sampai akun terkunci'" },
      // v11: registration_status, rejection_reason
      { table: 'users', column: 'registration_status', check: 'enum', sql: "ALTER TABLE users ADD COLUMN registration_status ENUM('pending','approved','rejected') DEFAULT 'approved' AFTER is_active" },
      { table: 'users', column: 'rejection_reason', check: 'text', sql: "ALTER TABLE users ADD COLUMN rejection_reason TEXT NULL AFTER registration_status" },
      // v14: nip, jabatan, divisi, nomor_hp (merge pegawai)
      { table: 'users', column: 'nip', check: 'varchar', sql: "ALTER TABLE users ADD COLUMN nip VARCHAR(20) DEFAULT NULL AFTER nama" },
      { table: 'users', column: 'jabatan', check: 'varchar', sql: "ALTER TABLE users ADD COLUMN jabatan VARCHAR(100) DEFAULT NULL AFTER nip" },
      { table: 'users', column: 'divisi', check: 'varchar', sql: "ALTER TABLE users ADD COLUMN divisi VARCHAR(100) DEFAULT NULL AFTER jabatan" },
      { table: 'users', column: 'nomor_hp', check: 'varchar', sql: "ALTER TABLE users ADD COLUMN nomor_hp VARCHAR(20) DEFAULT NULL AFTER divisi" },
      // v7: lokasi_id on barang
      { table: 'barang', column: 'lokasi_id', check: 'int', sql: "ALTER TABLE barang ADD COLUMN lokasi_id INT DEFAULT NULL AFTER kategori_id" },
      // v8: catatan_admin on pengembalian
      { table: 'pengembalian', column: 'catatan_admin', check: 'text', sql: "ALTER TABLE pengembalian ADD COLUMN catatan_admin TEXT NULL AFTER catatan" },
      // v5: foto on peminjaman
      { table: 'peminjaman', column: 'foto', check: 'varchar', sql: "ALTER TABLE peminjaman ADD COLUMN foto VARCHAR(255) DEFAULT NULL AFTER keperluan" },
    ];

    for (const alter of alterStatements) {
      try {
        const [cols] = await connection.query(
          `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
          [DB_NAME, alter.table, alter.column]
        );
        if (cols.length === 0) {
          await connection.query(alter.sql);
          console.log(`  ✅ Added column ${alter.table}.${alter.column}`);
        }
      } catch (err) {
        // Column might already exist or table doesn't exist yet
        if (err.code !== 'ER_DUP_FIELDNAME') {
          console.log(`  ⚠️  ${alter.table}.${alter.column}: ${err.message}`);
        }
      }
    }

    // 6. Ensure all indexes exist (idempotent)
    const indexStatements = [
      { name: 'idx_role', table: 'users', sql: 'ALTER TABLE users ADD INDEX idx_role (role)' },
      { name: 'idx_is_active', table: 'users', sql: 'ALTER TABLE users ADD INDEX idx_is_active (is_active)' },
      { name: 'idx_users_locked_until', table: 'users', sql: 'ALTER TABLE users ADD INDEX idx_users_locked_until (locked_until)' },
      { name: 'idx_users_registration_status', table: 'users', sql: 'ALTER TABLE users ADD INDEX idx_users_registration_status (registration_status)' },
      { name: 'idx_audit_log_created_at', table: 'audit_log', sql: 'ALTER TABLE audit_log ADD INDEX idx_audit_log_created_at (created_at)' },
      { name: 'idx_barang_lokasi_id', table: 'barang', sql: 'ALTER TABLE barang ADD INDEX idx_barang_lokasi_id (lokasi_id)' },
    ];

    for (const idx of indexStatements) {
      try {
        const [indexes] = await connection.query(
          `SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1`,
          [DB_NAME, idx.table, idx.name]
        );
        if (indexes.length === 0) {
          await connection.query(idx.sql);
          console.log(`  ✅ Added index ${idx.name}`);
        }
      } catch (err) {
        if (err.code !== 'ER_DUP_KEYNAME') {
          console.log(`  ⚠️  Index ${idx.name}: ${err.message}`);
        }
      }
    }

    // 7. Ensure unique indexes exist (v10, v15, v16)
    const uniqueIndexes = [
      { name: 'uk_kategori_nama', table: 'kategori', sql: 'ALTER TABLE kategori ADD UNIQUE INDEX uk_kategori_nama (nama)' },
      { name: 'uk_lokasi_nama_lokasi', table: 'lokasi', sql: 'ALTER TABLE lokasi ADD UNIQUE INDEX uk_lokasi_nama_lokasi (nama_lokasi)' },
      { name: 'uk_barang_nama_barang', table: 'barang', sql: 'ALTER TABLE barang ADD UNIQUE INDEX uk_barang_nama_barang (nama_barang)' },
      { name: 'uk_users_nip', table: 'users', sql: 'ALTER TABLE users ADD UNIQUE INDEX uk_users_nip (nip)' },
    ];

    for (const uidx of uniqueIndexes) {
      try {
        const [indexes] = await connection.query(
          `SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1`,
          [DB_NAME, uidx.table, uidx.name]
        );
        if (indexes.length === 0) {
          await connection.query(uidx.sql);
          console.log(`  ✅ Added unique index ${uidx.name}`);
        }
      } catch (err) {
        if (err.code !== 'ER_DUP_KEYNAME') {
          console.log(`  ⚠️  Unique index ${uidx.name}: ${err.message}`);
        }
      }
    }

    // 8. Update ENUM values (idempotent)
    try {
      await connection.query("ALTER TABLE users MODIFY COLUMN role ENUM('super_admin','admin','pegawai') DEFAULT 'pegawai'");
      await connection.query("ALTER TABLE pengembalian MODIFY COLUMN status ENUM('Menunggu Konfirmasi','Diterima','Ditolak') DEFAULT 'Menunggu Konfirmasi'");
      console.log('  ✅ ENUM values updated');
    } catch (err) {
      console.log(`  ⚠️  ENUM update: ${err.message}`);
    }

    // 9. Update pegawai_id FK (v14: reference users instead of pegawai table)
    try {
      // Check if old FK exists
      const [oldFK] = await connection.query(
        `SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'peminjaman' AND CONSTRAINT_TYPE = 'FOREIGN KEY'`,
        [DB_NAME]
      );

      // Drop old FK if exists
      for (const fk of oldFK) {
        try {
          await connection.query(`ALTER TABLE peminjaman DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`);
          console.log(`  ✅ Dropped old FK: ${fk.CONSTRAINT_NAME}`);
        } catch (e) { /* ignore */ }
      }

      // Make pegawai_id nullable
      await connection.query('ALTER TABLE peminjaman MODIFY COLUMN pegawai_id INT DEFAULT NULL');

      // Add new FK
      try {
        await connection.query('ALTER TABLE peminjaman ADD CONSTRAINT fk_peminjaman_user FOREIGN KEY (pegawai_id) REFERENCES users(id) ON DELETE SET NULL');
        console.log('  ✅ Added FK: pegawai_id → users.id');
      } catch (err) {
        if (err.code !== 'ER_DUP_FIELDNAME' && err.code !== 'ER_DUP_KEYNAME') {
          console.log(`  ⚠️  FK peminjaman: ${err.message}`);
        }
      }
    } catch (err) {
      console.log(`  ⚠️  FK migration: ${err.message}`);
    }

    // 10. Drop old pegawai table if exists (v14)
    try {
      await connection.query('DROP TABLE IF EXISTS pegawai');
      console.log('  ✅ Dropped old pegawai table (if existed)');
    } catch (err) {
      console.log(`  ⚠️  Drop pegawai: ${err.message}`);
    }

    // 11. Update existing roles (v6: old roles → new roles)
    try {
      await connection.query("UPDATE users SET role = 'pegawai' WHERE role IN ('operator', 'viewer', '')");
      await connection.query("UPDATE users SET role = 'pegawai' WHERE role IS NULL");
      await connection.query("UPDATE users SET registration_status = 'approved' WHERE registration_status IS NULL OR registration_status = ''");
      await connection.query("UPDATE users SET is_active = 1 WHERE is_active IS NULL");
      console.log('  ✅ Data migration (roles & defaults) updated');
    } catch (err) {
      console.log(`  ⚠️  Data migration: ${err.message}`);
    }

    // 12. Migrate pegawai data to users if old table still has data
    try {
      const [pegawaiCols] = await connection.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'nip'`,
        [DB_NAME]
      );

      if (pegawaiCols.length > 0) {
        // Try to update users with pegawai data if pegawai table exists
        const [pegawaiTable] = await connection.query(
          `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'pegawai'`,
          [DB_NAME]
        );

        if (pegawaiTable.length > 0) {
          try {
            await connection.query(`
              UPDATE users u
              INNER JOIN pegawai p ON p.user_id = u.id
              SET u.nip = p.nip, u.jabatan = p.jabatan, u.divisi = p.divisi, u.nomor_hp = p.nomor_hp
              WHERE u.nip IS NULL
            `);
            console.log('  ✅ Migrated pegawai data to users table');
          } catch (e) {
            console.log('  ⚠️  Pegawai data migration skipped (no data to migrate)');
          }
        }
      }
    } catch (err) {
      console.log(`  ⚠️  Pegawai data migration: ${err.message}`);
    }

    // 13. Seed super admin account (idempotent)
    console.log('  👤 Seeding super admin account...');
    const superAdminPassword = await bcrypt.hash('superadmin123', 10);
    try {
      const [existing] = await connection.query(
        'SELECT id FROM users WHERE role = ? LIMIT 1',
        ['super_admin']
      );

      if (existing.length === 0) {
        await connection.query(
          'INSERT INTO users (username, email, password, nama, role, is_active, registration_status) VALUES (?, ?, ?, ?, ?, ?, ?)',
          ['superadmin', 'superadmin@tvri.go.id', superAdminPassword, 'Super Administrator', 'super_admin', 1, 'approved']
        );
        console.log('  ✅ Super admin created (username: superadmin)');
      } else {
        console.log('  ✅ Super admin already exists');
      }
    } catch (err) {
      console.log(`  ⚠️  Super admin: ${err.message}`);
    }

    // 14. Seed admin account (idempotent)
    console.log('  👤 Seeding admin account...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    try {
      const [existing] = await connection.query(
        'SELECT id FROM users WHERE username = ? LIMIT 1',
        ['admin']
      );

      if (existing.length === 0) {
        await connection.query(
          'INSERT INTO users (username, email, password, nama, role, is_active, registration_status) VALUES (?, ?, ?, ?, ?, ?, ?)',
          ['admin', 'admin@tvri.go.id', adminPassword, 'Administrator', 'admin', 1, 'approved']
        );
        console.log('  ✅ Admin created (username: admin)');
      } else {
        console.log('  ✅ Admin account already exists');
      }
    } catch (err) {
      console.log(`  ⚠️  Admin: ${err.message}`);
    }

    // 15. Remove default_password setting (no longer used)
    try {
      await connection.query("DELETE FROM system_settings WHERE setting_key = 'default_password'");
      console.log('  ✅ Removed default_password setting (no longer used)');
    } catch (err) {
      console.log(`  ⚠️  Remove default_password: ${err.message}`);
    }

    // 16. Final verification
    console.log('');
    console.log('  📊 Verifying tables...');
    const [finalTables] = await connection.query('SHOW TABLES');
    const finalTableNames = finalTables.map(t => Object.values(t)[0]);
    const requiredTables = ['users', 'kategori', 'lokasi', 'barang', 'peminjaman', 'pengembalian', 'audit_log', 'notifications', 'system_settings', 'email_verifications'];

    let allGood = true;
    for (const req of requiredTables) {
      if (finalTableNames.includes(req)) {
        console.log(`  ✅ ${req}`);
      } else {
        console.log(`  ❌ ${req} MISSING`);
        allGood = false;
      }
    }

    // Count users
    const [userCount] = await connection.query('SELECT COUNT(*) as count FROM users');
    console.log(`  📊 Total users: ${userCount[0].count}`);

    await connection.end();

    console.log('');
    if (allGood) {
      console.log('  ╔══════════════════════════════════════════════════╗');
      console.log('  ║  ✅ MIGRATION COMPLETE — All tables verified!    ║');
      console.log('  ╠══════════════════════════════════════════════════╣');
      console.log('  ║  🔑 Super Admin: superadmin / superadmin123      ║');
      console.log('  ║  🔑 Admin:       admin / admin123                ║');
      console.log('  ╚══════════════════════════════════════════════════╝');
    } else {
      console.log('  ⚠️  Migration completed with warnings. Check errors above.');
    }
    console.log('');

  } catch (error) {
    console.error('  ❌ Migration failed:', error.message);
    if (connection) await connection.end();
    process.exit(1);
  }
}

migrate();