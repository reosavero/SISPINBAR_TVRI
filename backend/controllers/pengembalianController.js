// ============================================
// PENGEMBALIAN CONTROLLER - Sistem Peminjaman Barang TVRI
// ============================================

const pengembalianService = require('../services/pengembalianService');

const pengembalianController = {
  getAll: async (req, res) => {
    try {
      const params = { ...req.query };

      // Jika pegawai (bukan admin), hanya tampilkan pengembalian miliknya
      if (req.user.role !== 'admin' && req.user.pegawai_id) {
        params.pegawai_id = req.user.pegawai_id;
      }

      const result = await pengembalianService.getAll(params);
      res.json({ success: true, ...result });
    } catch (error) {
      console.error('Get pengembalian error:', error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  create: async (req, res) => {
    try {
      // Parse peminjaman_id to integer (FormData sends string)
      const peminjaman_id = parseInt(req.body.peminjaman_id, 10);
      if (isNaN(peminjaman_id)) {
        return res.status(400).json({
          success: false,
          message: 'ID peminjaman tidak valid',
        });
      }

      const data = {
        peminjaman_id,
        kondisi_barang: req.body.kondisi_barang || 'Baik',
        catatan: req.body.catatan || null,
        foto: req.file ? `/uploads/pengembalian/${req.file.filename}` : null,
      };

      const result = await pengembalianService.create(data);
      res.status(201).json({ success: true, data: result, message: 'Pengembalian berhasil diproses' });
    } catch (error) {
      console.error('Create pengembalian error:', error.message);
      const statusCode = error.message.includes('tidak ditemukan') ||
                         error.message.includes('tidak dapat dikembalikan') ||
                         error.message.includes('sudah dikembalikan') ||
                         error.message.includes('masih menunggu') ? 400 : 500;
      res.status(statusCode).json({ success: false, message: error.message });
    }
  },
};

module.exports = pengembalianController;