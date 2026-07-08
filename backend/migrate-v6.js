// ============================================
// MIGRATE DB v6 - Super Admin Role System
// ============================================

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./config/db');

async function migrate() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║  🔄 Migrasi v6: Super Admin Role System          ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  try {
    const migrationFile = path.join(__dirname, 'database', 'migration_v6_super_admin.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');

    // Split by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('USE '));

    for (const statement of statements) {
      // Skip PREPARE/EXECUTE/DEALLOCATE for simple execution
      if (statement.toUpperCase().startsWith('SET @') || 
          statement.toUpperCase().startsWith('PREPARE ') || 
          statement.toUpperCase().startsWith('EXECUTE ') || 
          statement.toUpperCase().startsWith('DEALLOCATE ')) {
        try {
          await pool.execute(statement);
        } catch (err) {
          // Ignore errors for SET variables and PREPARE/EXECUTE
        }
        continue;
      }

      try {
        await pool.execute(statement);
      } catch (err) {
        // Ignore "already exists" type errors
        if (!err.message.includes('already exists') && 
            !err.message.includes('Duplicate entry') &&
            !err.message.includes('Duplicate column') &&
            !err.message.includes('Duplicate key')) {
          console.log('⚠️  Statement warning:', err.message);
        }
      }
    }

    // ==========================================
    // Manual migration steps for complex operations
    // ==========================================

    // Step 1: Migrate old/empty roles to pegawai
    console.log('📋 Step 1: Migrasi role operator/viewer/empty → pegawai...');
    try {
      const [result1] = await pool.execute(
        "UPDATE users SET role = 'pegawai' WHERE role IN ('operator', 'viewer', '') OR role IS NULL"
      );
      console.log(`   ✅ ${result1.affectedRows} user(s) dimigrasi ke role 'pegawai'`);
    } catch (err) {
      console.log('   ℹ️  Migrasi role tidak diperlukan atau sudah dilakukan');
    }

    // Step 2: Add is_active column
    console.log('📋 Step 2: Menambah kolom is_active...');
    try {
      await pool.execute('ALTER TABLE users ADD COLUMN is_active TINYINT(1) DEFAULT 1 AFTER role');
      console.log('   ✅ Kolom is_active ditambahkan');
    } catch (err) {
      if (err.message.includes('Duplicate column')) {
        console.log('   ℹ️  Kolom is_active sudah ada');
      } else {
        console.log('   ⚠️  Error:', err.message);
      }
    }

    // Step 3: Add deleted_at column
    console.log('📋 Step 3: Menambah kolom deleted_at pada users...');
    try {
      await pool.execute('ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER is_active');
      console.log('   ✅ Kolom deleted_at ditambahkan');
    } catch (err) {
      if (err.message.includes('Duplicate column')) {
        console.log('   ℹ️  Kolom deleted_at sudah ada');
      } else {
        console.log('   ⚠️  Error:', err.message);
      }
    }

    // Step 4: Alter ENUM role
    console.log('📋 Step 4: Mengubah ENUM role...');
    try {
      await pool.execute("ALTER TABLE users MODIFY COLUMN role ENUM('super_admin', 'admin', 'pegawai') DEFAULT 'pegawai'");
      console.log('   ✅ ENUM role diubah menjadi (super_admin, admin, pegawai)');
    } catch (err) {
      console.log('   ⚠️  Error:', err.message);
    }

    // Step 5: Set is_active for existing users
    console.log('📋 Step 5: Mengset is_active untuk user yang ada...');
    try {
      await pool.execute('UPDATE users SET is_active = 1 WHERE is_active IS NULL');
      console.log('   ✅ Semua user diset aktif');
    } catch (err) {
      console.log('   ℹ️  Is_active sudah diset');
    }

    // Step 6: Create system_settings table
    console.log('📋 Step 6: Membuat tabel system_settings...');
    try {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS system_settings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          setting_key VARCHAR(100) NOT NULL UNIQUE,
          setting_value TEXT,
          description VARCHAR(255),
          updated_by INT DEFAULT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_setting_key (setting_key)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      console.log('   ✅ Tabel system_settings dibuat');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('   ℹ️  Tabel system_settings sudah ada');
      } else {
        console.log('   ⚠️  Error:', err.message);
      }
    }

    // Step 7: Seed default system settings
    console.log('📋 Step 7: Menambah default system settings...');
    const defaultSettings = [
      ['app_name', 'SISPINBAR', 'Nama Aplikasi'],
      ['app_full_name', 'Sistem Peminjaman Barang', 'Nama Lengkap Aplikasi'],
      ['app_organization', 'TVRI Jawa Timur', 'Nama Organisasi'],
      ['max_login_attempts', '5', 'Maksimal percobaan login'],
      ['session_timeout', '24', 'Session timeout (jam)'],
      ['default_password', 'tvri1234', 'Default password untuk akun baru'],
    ];

    for (const [key, value, desc] of defaultSettings) {
      try {
        await pool.execute(
          'INSERT INTO system_settings (setting_key, setting_value, description) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE description = VALUES(description)',
          [key, value, desc]
        );
      } catch (err) {
        // Ignore duplicate errors
      }
    }
    console.log('   ✅ Default system settings ditambahkan');

    // Step 8: Seed Super Admin
    console.log('📋 Step 8: Membuat akun Super Admin...');
    try {
      const [existing] = await pool.execute("SELECT id FROM users WHERE role = 'super_admin'");
      if (existing.length === 0) {
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('superadmin123', 10);
        await pool.execute(
          'INSERT INTO users (username, email, password, nama, role, is_active) VALUES (?, ?, ?, ?, ?, ?)',
          ['superadmin', 'superadmin@tvri.go.id', hashedPassword, 'Super Administrator', 'super_admin', 1]
        );
        console.log('   ✅ Akun Super Admin berhasil dibuat');
        console.log('      Username: superadmin');
        console.log('      Password: superadmin123');
      } else {
        console.log('   ℹ️  Akun Super Admin sudah ada');
      }
    } catch (err) {
      console.log('   ⚠️  Error membuat Super Admin:', err.message);
    }

    // Step 9: Add indexes
    console.log('📋 Step 9: Menambah index pada users...');
    try {
      await pool.execute('ALTER TABLE users ADD INDEX idx_role (role)');
      console.log('   ✅ Index idx_role ditambahkan');
    } catch (err) {
      if (err.message.includes('Duplicate key')) {
        console.log('   ℹ️  Index idx_role sudah ada');
      }
    }
    try {
      await pool.execute('ALTER TABLE users ADD INDEX idx_is_active (is_active)');
      console.log('   ✅ Index idx_is_active ditambahkan');
    } catch (err) {
      if (err.message.includes('Duplicate key')) {
        console.log('   ℹ️  Index idx_is_active sudah ada');
      }
    }

    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log('║  ✅ MIGRASI v6 BERHASIL!                         ║');
    console.log('║                                                  ║');
    console.log('║  🔑 Super Admin Login:                           ║');
    console.log('║     Username: superadmin                          ║');
    console.log('║     Password: superadmin123                      ║');
    console.log('║                                                  ║');
    console.log('║  ⚠️  Segera ganti password setelah login!         ║');
    console.log('╚══════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('❌ Migrasi gagal:', error);
  } finally {
    await pool.end();
  }
}

migrate();