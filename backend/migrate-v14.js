// ============================================
// MIGRATION v14: Merge pegawai into users table
// ============================================

const pool = require('./config/db');

async function migrate() {
  console.log('🔄 Running Migration v14: Merge pegawai into users...');

  try {
    // Check if nip column already exists
    const [cols] = await pool.execute('DESCRIBE users');
    const hasNip = cols.some(c => c.Field === 'nip');

    if (!hasNip) {
      // Step 1: Add columns to users
      console.log('  ⏳ Adding nip, jabatan, divisi, nomor_hp to users table...');
      await pool.execute(`
        ALTER TABLE users
          ADD COLUMN nip VARCHAR(20) DEFAULT NULL AFTER nama,
          ADD COLUMN jabatan VARCHAR(100) DEFAULT NULL AFTER nip,
          ADD COLUMN divisi VARCHAR(100) DEFAULT NULL AFTER jabatan,
          ADD COLUMN nomor_hp VARCHAR(20) DEFAULT NULL AFTER divisi
      `);
      console.log('  ✅ Columns added to users table');

      // Step 2: Migrate data
      console.log('  ⏳ Migrating data from pegawai to users...');
      const [result] = await pool.execute(`
        UPDATE users u
          INNER JOIN pegawai p ON p.user_id = u.id
        SET u.nip = p.nip,
            u.jabatan = p.jabatan,
            u.divisi = p.divisi,
            u.nomor_hp = p.nomor_hp
      `);
      console.log(`  ✅ Migrated ${result.affectedRows} rows`);

      // Step 3: Unique index on nip
      console.log('  ⏳ Adding unique index on nip...');
      await pool.execute('CREATE UNIQUE INDEX uk_users_nip ON users (nip)');
      console.log('  ✅ Unique index on nip created');
    } else {
      console.log('  ⏩ Columns already exist, skipping Step 1-3');
    }

    // Step 4: Drop old FK
    console.log('  ⏳ Dropping FK peminjaman_ibfk_1...');
    try {
      await pool.execute('ALTER TABLE peminjaman DROP FOREIGN KEY peminjaman_ibfk_1');
      console.log('  ✅ Old FK dropped');
    } catch (e) {
      if (e.message.includes('non-existent')) {
        console.log('  ⏩ Old FK already dropped');
      } else throw e;
    }

    // Step 5: Make pegawai_id nullable
    console.log('  ⏳ Making peminjaman.pegawai_id nullable...');
    await pool.execute('ALTER TABLE peminjaman MODIFY COLUMN pegawai_id INT(11) DEFAULT NULL');
    console.log('  ✅ pegawai_id is now nullable');

    // Step 6: Update pegawai_id values
    console.log('  ⏳ Updating peminjaman.pegawai_id to reference users.id...');
    const [pemResult] = await pool.execute(`
      UPDATE peminjaman pm
        INNER JOIN pegawai pg ON pm.pegawai_id = pg.id
      SET pm.pegawai_id = pg.user_id
    `);
    console.log(`  ✅ Updated ${pemResult.affectedRows} peminjaman rows`);

    // Step 7: Add new FK
    console.log('  ⏳ Adding FK peminjaman.pegawai_id -> users.id...');
    try {
      await pool.execute(`
        ALTER TABLE peminjaman
          ADD CONSTRAINT fk_peminjaman_user
          FOREIGN KEY (pegawai_id) REFERENCES users(id)
          ON DELETE SET NULL
      `);
      console.log('  ✅ New FK added');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('  ⏩ FK already exists');
      } else throw e;
    }

    // Step 8: Drop pegawai table
    console.log('  ⏳ Dropping pegawai table...');
    await pool.execute('DROP TABLE IF EXISTS pegawai');
    console.log('  ✅ pegawai table dropped');

    console.log('✅ Migration v14 completed successfully!');
  } catch (error) {
    console.error('❌ Migration v14 failed:', error.message);
    throw error;
  }
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });