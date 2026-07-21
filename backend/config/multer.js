

const multer = require('multer');
const path = require('path');
const sharp = require('sharp');

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

const avatarMemoryStorage = multer.memoryStorage();

const uploadAvatarRaw = multer({
  storage: avatarMemoryStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, 
  },
});

const resizeAvatarFoto = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const filename = `avatar-${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
    const filepath = path.join(__dirname, '..', 'uploads', 'avatars', filename);

    
    
    await sharp(req.file.buffer)
      .resize(600, 600, {
        fit: 'cover',           
        position: 'top',        
      })
      .jpeg({ quality: 92 })     
      .toFile(filepath);

    
    req.file.filename = filename;

    next();
  } catch (error) {
    console.error('Error optimizing avatar:', error);
    next(error);
  }
};

const uploadAvatar = [uploadAvatarRaw.single('avatar'), resizeAvatarFoto];

const barangMemoryStorage = multer.memoryStorage();

const uploadBarangRaw = multer({
  storage: barangMemoryStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, 
  },
});

const resizeBarangFoto = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const filename = `barang-${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
    const filepath = path.join(__dirname, '..', 'uploads', 'barang', filename);

    
    
    await sharp(req.file.buffer)
      .resize(1200, 1200, {
        fit: 'inside',               
        withoutEnlargement: true,   
      })
      .jpeg({ quality: 85 })         
      .toFile(filepath);

    
    req.file.filename = filename;

    next();
  } catch (error) {
    console.error('Error optimizing barang foto:', error);
    next(error);
  }
};

const uploadBarang = [uploadBarangRaw.single('foto'), resizeBarangFoto];

const pengembalianMemoryStorage = multer.memoryStorage();

const uploadPengembalianRaw = multer({
  storage: pengembalianMemoryStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, 
  },
});

const resizePengembalianFoto = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const filename = `pengembalian-${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
    const filepath = path.join(__dirname, '..', 'uploads', 'pengembalian', filename);

    
    await sharp(req.file.buffer)
      .resize(1200, 1200, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85 })
      .toFile(filepath);

    
    req.file.filename = filename;

    next();
  } catch (error) {
    console.error('Error optimizing pengembalian foto:', error);
    next(error);
  }
};

const uploadPengembalian = [uploadPengembalianRaw.single('foto'), resizePengembalianFoto];

const peminjamanMemoryStorage = multer.memoryStorage();

const uploadPeminjamanRaw = multer({
  storage: peminjamanMemoryStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, 
  },
});

const resizePeminjamanFoto = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const filename = `peminjaman-${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
    const filepath = path.join(__dirname, '..', 'uploads', 'peminjaman', filename);

    
    await sharp(req.file.buffer)
      .resize(1200, 1200, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85 })
      .toFile(filepath);

    
    req.file.filename = filename;

    next();
  } catch (error) {
    console.error('Error optimizing peminjaman foto:', error);
    next(error);
  }
};

const uploadPeminjaman = [uploadPeminjamanRaw.single('foto'), resizePeminjamanFoto];

module.exports = { uploadAvatar, uploadBarang, uploadPengembalian, uploadPeminjaman };