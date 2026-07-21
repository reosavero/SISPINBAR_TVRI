

const pengembalianService = require('../services/pengembalianService');

const pengembalianController = {
  getAll: async (req, res) => {
    try {
      const params = { ...req.query };

      
      if (req.user.role === 'pegawai') {
        params.pegawai_id = req.user.id;
      }

      const result = await pengembalianService.getAll(params);
      res.json({ success: true, ...result });
    } catch (error) {
      console.error('Get pengembalian error:', error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  
  getById: async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'ID tidak valid' });
      }

      const result = await pengembalianService.getById(id);

      
      if (req.user.role === 'pegawai' && result.pegawai_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Anda tidak memiliki akses untuk melihat pengembalian ini' });
      }

      res.json({ success: true, data: result });
    } catch (error) {
      console.error('Get pengembalian detail error:', error.message);
      res.status(error.message.includes('tidak ditemukan') ? 404 : 500)
         .json({ success: false, message: error.message });
    }
  },

  create: async (req, res) => {
    try {
      
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
                         error.message.includes('masih menunggu') ||
                         error.message.includes('menunggu konfirmasi') ? 400 : 500;
      res.status(statusCode).json({ success: false, message: error.message });
    }
  },

  
  confirm: async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'ID tidak valid' });
      }

      const result = await pengembalianService.confirm(id, req.user);
      res.json({ success: true, data: result, message: 'Pengembalian berhasil dikonfirmasi' });
    } catch (error) {
      console.error('Confirm pengembalian error:', error.message);
      res.status(error.message.includes('tidak ditemukan') || error.message.includes('sudah dikonfirmasi') ? 400 : 500)
         .json({ success: false, message: error.message });
    }
  },

  
  reject: async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'ID tidak valid' });
      }

      const { catatan_admin } = req.body || {};
      const result = await pengembalianService.reject(id, catatan_admin, { id: req.user.id, username: req.user.username, ip: req.ip });
      res.json({ success: true, data: result, message: 'Pengembalian berhasil ditolak' });
    } catch (error) {
      console.error('Reject pengembalian error:', error.message);
      const statusCode = error.message.includes('tidak ditemukan') || error.message.includes('sudah') ? 400 : 500;
      res.status(statusCode).json({ success: false, message: error.message });
    }
  },

  
  bulkConfirm: async (req, res) => {
    try {
      const { ids } = req.body;
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, message: 'Pilih minimal satu pengembalian' });
      }

      const results = await pengembalianService.bulkConfirm(ids, req.user);
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      res.json({
        success: true,
        message: `${successCount} pengembalian berhasil dikonfirmasi${failCount > 0 ? `, ${failCount} gagal` : ''}`,
        data: results,
      });
    } catch (error) {
      console.error('Bulk confirm pengembalian error:', error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  },
};

module.exports = pengembalianController;