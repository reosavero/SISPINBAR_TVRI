-- ============================================
-- MIGRATION v14: Merge pegawai into users table
-- Moves nip, jabatan, divisi, nomor_hp from pegawai to users
-- Updates peminjaman FK, drops pegawai table
-- ============================================

-- Step 1: Add pegawai columns to users table
ALTER TABLE users
  ADD COLUMN nip VARCHAR(20) DEFAULT NULL AFTER nama,
  ADD COLUMN jabatan VARCHAR(100) DEFAULT NULL AFTER nip,
  ADD COLUMN divisi VARCHAR(100) DEFAULT NULL AFTER jabatan,
  ADD COLUMN nomor_hp VARCHAR(20) DEFAULT NULL AFTER divisi;

-- Step 2: Migrate data from pegawai to users
UPDATE users u
  INNER JOIN pegawai p ON p.user_id = u.id
SET u.nip = p.nip,
    u.jabatan = p.jabatan,
    u.divisi = p.divisi,
    u.nomor_hp = p.nomor_hp;

-- Step 3: Add unique index on nip (nullable, only for pegawai)
CREATE UNIQUE INDEX uk_users_nip ON users (nip);

-- Step 4: Drop existing FK constraint on peminjaman.pegawai_id -> pegawai.id
ALTER TABLE peminjaman DROP FOREIGN KEY peminjaman_ibfk_1;

-- Step 5: Make pegawai_id nullable (required for ON DELETE SET NULL)
ALTER TABLE peminjaman MODIFY COLUMN pegawai_id INT(11) DEFAULT NULL;

-- Step 6: Update peminjaman.pegawai_id to reference users.id
UPDATE peminjaman pm
  INNER JOIN pegawai pg ON pm.pegawai_id = pg.id
SET pm.pegawai_id = pg.user_id;

-- Step 7: Add new FK constraint: peminjaman.pegawai_id -> users.id
ALTER TABLE peminjaman
  ADD CONSTRAINT fk_peminjaman_user
  FOREIGN KEY (pegawai_id) REFERENCES users(id)
  ON DELETE SET NULL;

-- Step 8: Drop the pegawai table
DROP TABLE IF EXISTS pegawai;