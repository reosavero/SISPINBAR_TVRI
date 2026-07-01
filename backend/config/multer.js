// ============================================
// MULTER CONFIG - Sistem Peminjaman Barang TVRI
// ============================================

const multer = require('multer');
const path = require('path');
const sharp = require('sharp');

// File filter - only images
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file gambar yang diperbolehkan (JPG, PNG, GIF, WebP)'), false);
  }
};

// Avatar upload dengan sharp optimization
const avatarMemoryStorage = multer.memoryStorage();

const uploadAvatarRaw = multer({
  storage: avatarMemoryStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

// Middleware untuk optimasi avatar (resize 600x600, kualitas tinggi)
const resizeAvatarFoto = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const filename = `avatar-${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
    const filepath = path.join(__dirname, '..', 'uploads', 'avatars', filename);

    // Optimasi: resize 600x600 (cukup besar untuk kualitas HD di frontend)
    // crop ke tengah (cover) agar selalu square dan fokus ke wajah
    await sharp(req.file.buffer)
      .resize(600, 600, {
        fit: 'cover',           // Crop ke tengah, selalu square
        position: 'top',        // Fokus ke bagian atas (wajah)
      })
      .jpeg({ quality: 92 })     // Kualitas tinggi untuk foto profil
      .toFile(filepath);

    // Override req.file dengan info file yang sudah di-resize
    req.file.filename = filename;

    next();
  } catch (error) {
    console.error('Error optimizing avatar:', error);
    next(error);
  }
};

const uploadAvatar = [uploadAvatarRaw.single('avatar'), resizeAvatarFoto];

// Storage configuration for barang image uploads
// Menggunakan memoryStorage agar bisa di-resize dengan sharp sebelum disimpan
const barangMemoryStorage = multer.memoryStorage();

const uploadBarangRaw = multer({
  storage: barangMemoryStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

// Middleware untuk optimasi foto barang (resize maks 1200px, maintain aspect ratio)
const resizeBarangFoto = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const filename = `barang-${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
    const filepath = path.join(__dirname, '..', 'uploads', 'barang', filename);

    // Optimasi: resize maksimal 1200px pada sisi terpanjang, maintain aspect ratio
    // Karena frontend sudah menangani cropping, backend hanya optimasi
    await sharp(req.file.buffer)
      .resize(1200, 1200, {
        fit: 'inside',               // Maintain aspect ratio, hanya scale down jika lebih besar
        withoutEnlargement: true,   // Jangan perbesar gambar kecil
      })
      .jpeg({ quality: 85 })         // Kompres ke JPEG kualitas 85%
      .toFile(filepath);

    // Override req.file dengan info file yang sudah di-resize
    req.file.filename = filename;

    next();
  } catch (error) {
    console.error('Error optimizing barang foto:', error);
    next(error);
  }
};

// Gabungkan upload + resize
const uploadBarang = [uploadBarangRaw.single('foto'), resizeBarangFoto];

// Storage configuration for pengembalian photo uploads
const pengembalianMemoryStorage = multer.memoryStorage();

const uploadPengembalianRaw = multer({
  storage: pengembalianMemoryStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

// Middleware untuk optimasi foto pengembalian (resize maks 1200px, maintain aspect ratio)
const resizePengembalianFoto = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const filename = `pengembalian-${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
    const filepath = path.join(__dirname, '..', 'uploads', 'pengembalian', filename);

    // Optimasi: resize maksimal 1200px pada sisi terpanjang, maintain aspect ratio
    await sharp(req.file.buffer)
      .resize(1200, 1200, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85 })
      .toFile(filepath);

    // Override req.file dengan info file yang sudah di-resize
    req.file.filename = filename;

    next();
  } catch (error) {
    console.error('Error optimizing pengembalian foto:', error);
    next(error);
  }
};

// Gabungkan upload + resize untuk pengembalian
const uploadPengembalian = [uploadPengembalianRaw.single('foto'), resizePengembalianFoto];

// Storage configuration for peminjaman photo uploads
const peminjamanMemoryStorage = multer.memoryStorage();

const uploadPeminjamanRaw = multer({
  storage: peminjamanMemoryStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

// Middleware untuk optimasi foto peminjaman (resize maks 1200px, maintain aspect ratio)
const resizePeminjamanFoto = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const filename = `peminjaman-${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
    const filepath = path.join(__dirname, '..', 'uploads', 'peminjaman', filename);

    // Optimasi: resize maksimal 1200px pada sisi terpanjang, maintain aspect ratio
    await sharp(req.file.buffer)
      .resize(1200, 1200, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85 })
      .toFile(filepath);

    // Override req.file dengan info file yang sudah di-resize
    req.file.filename = filename;

    next();
  } catch (error) {
    console.error('Error optimizing peminjaman foto:', error);
    next(error);
  }
};

// Gabungkan upload + resize untuk peminjaman
const uploadPeminjaman = [uploadPeminjamanRaw.single('foto'), resizePeminjamanFoto];

module.exports = { uploadAvatar, uploadBarang, uploadPengembalian, uploadPeminjaman };