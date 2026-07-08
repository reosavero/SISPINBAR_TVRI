-- ============================================
-- MIGRATION v11: Add registration_status to users table
-- Supports self-registration with admin approval flow
-- ============================================

ALTER TABLE users
  ADD COLUMN registration_status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved' COMMENT 'pending = menunggu persetujuan, approved = disetujui, rejected = ditolak' AFTER is_active,
  ADD COLUMN rejection_reason TEXT NULL COMMENT 'Alasan penolakan registrasi' AFTER registration_status;

-- Existing users are already 'approved' (default value set to 'approved')
-- New self-registered pegawai will have registration_status = 'pending'

-- Add index for querying pending registrations
CREATE INDEX idx_users_registration_status ON users (registration_status);

-- Update all existing users to explicitly set 'approved'
UPDATE users SET registration_status = 'approved' WHERE registration_status = 'approved' OR registration_status IS NULL;