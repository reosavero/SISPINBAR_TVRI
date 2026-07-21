

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const barangRoutes = require('./routes/barangRoutes');
const kategoriRoutes = require('./routes/kategoriRoutes');
const pegawaiRoutes = require('./routes/pegawaiRoutes');
const peminjamanRoutes = require('./routes/peminjamanRoutes');
const pengembalianRoutes = require('./routes/pengembalianRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const riwayatRoutes = require('./routes/riwayatRoutes');
const exportRoutes = require('./routes/exportRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const perpanjanganRoutes = require('./routes/perpanjanganRoutes');
const auditRoutes = require('./routes/auditRoutes');
const archiveRoutes = require('./routes/archiveRoutes');
const userRoutes = require('./routes/userRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const lokasiRoutes = require('./routes/lokasiRoutes');
const jabatanRoutes = require('./routes/jabatanRoutes');
const divisiRoutes = require('./routes/divisiRoutes');

const { auth, authorize } = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'http://localhost:5000', 'http://localhost:3000'],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
      fontSrc: ["'self'", 'https:', 'data:'],
      connectSrc: ["'self'", 'http://localhost:5000', 'http://localhost:3000'],
    },
  },
}));
app.use(morgan('dev'));

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/barang', barangRoutes);
app.use('/api/kategori', kategoriRoutes);
app.use('/api/pegawai', pegawaiRoutes);
app.use('/api/peminjaman', peminjamanRoutes);
app.use('/api/pengembalian', pengembalianRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/riwayat', riwayatRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/perpanjangan', perpanjanganRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/archive', archiveRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/lokasi', lokasiRoutes);
app.use('/api/jabatan', jabatanRoutes);
app.use('/api/divisi', divisiRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

module.exports = app;