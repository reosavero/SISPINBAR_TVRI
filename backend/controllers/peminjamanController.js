// ============================================
// PEMINJAMAN CONTROLLER - Sistem Peminjaman Barang TVRI
// ============================================

const peminjamanService = require('../services/peminjamanService');

const peminjamanController = {
  getAll: async (req, res) => {
    try {
      const params = { ...req.query };

      // Jika pegawai (bukan admin), hanya tampilkan peminjaman miliknya
      if (req.user.role !== 'admin' && req.user.pegawai_id) {
        params.pegawai_id = req.user.pegawai_id;
      }

      const result = await peminjamanService.getAll(params);
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const result = await peminjamanService.getById(req.params.id);
      if (!result) return res.status(404).json({ success: false, message: 'Peminjaman tidak ditemukan' });

      // Jika pegawai, pastikan hanya bisa melihat peminjaman miliknya
      if (req.user.role !== 'admin' && req.user.pegawai_id && result.pegawai_id !== req.user.pegawai_id) {
        return res.status(403).json({ success: false, message: 'Anda tidak memiliki akses untuk melihat peminjaman ini' });
      }

      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const data = {
        pegawai_id: req.body.pegawai_id,
        barang_id: req.body.barang_id,
        jumlah: req.body.jumlah,
        tanggal_pinjam: req.body.tanggal_pinjam,
        tanggal_kembali_rencana: req.body.tanggal_kembali_rencana,
        keperluan: req.body.keperluan,
        foto: req.file ? `/uploads/peminjaman/${req.file.filename}` : null,
      };

      // Jika pegawai (bukan admin), auto-assign pegawai_id dari user yang login
      if (req.user.role !== 'admin' && req.user.pegawai_id) {
        data.pegawai_id = req.user.pegawai_id;
      }

      const result = await peminjamanService.create(data);
      res.status(201).json({ success: true, data: result, message: 'Peminjaman berhasil dibuat' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  approve: async (req, res) => {
    try {
      const result = await peminjamanService.approve(req.params.id);
      res.json({ success: true, data: result, message: 'Peminjaman berhasil disetujui' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  reject: async (req, res) => {
    try {
      const result = await peminjamanService.reject(req.params.id);
      res.json({ success: true, data: result, message: 'Peminjaman berhasil ditolak' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const result = await peminjamanService.delete(req.params.id);
      res.json({ success: true, data: result, message: 'Peminjaman berhasil dihapus' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Bulk approve/reject (admin only)
  bulkAction: async (req, res) => {
    try {
      const { ids, action } = req.body;
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, message: 'Pilih minimal satu peminjaman' });
      }
      if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ success: false, message: 'Aksi tidak valid' });
      }

      const results = [];
      for (const id of ids) {
        try {
          if (action === 'approve') {
            await peminjamanService.approve(id);
          } else {
            await peminjamanService.reject(id);
          }
          results.push({ id, success: true });
        } catch (err) {
          results.push({ id, success: false, message: err.message });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      const actionText = action === 'approve' ? 'disetujui' : 'ditolak';

      res.json({
        success: true,
        message: `${successCount} peminjaman berhasil ${actionText}${failCount > 0 ? `, ${failCount} gagal` : ''}`,
        data: results,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Pegawai can update their own peminjaman if still Menunggu Persetujuan
  updateByPegawai: async (req, res) => {
    try {
      const pegawaiId = req.user.pegawai_id;
      if (!pegawaiId) {
        return res.status(403).json({ success: false, message: 'Akses ditolak' });
      }

      const data = {
        barang_id: req.body.barang_id,
        jumlah: req.body.jumlah,
        tanggal_pinjam: req.body.tanggal_pinjam,
        tanggal_kembali_rencana: req.body.tanggal_kembali_rencana,
        keperluan: req.body.keperluan,
        foto: req.file ? `/uploads/peminjaman/${req.file.filename}` : req.body.foto_lama || null,
      };

      const result = await peminjamanService.update(req.params.id, data, pegawaiId);
      res.json({ success: true, data: result, message: 'Peminjaman berhasil diperbarui' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  // Pegawai can delete their own peminjaman if still Menunggu Persetujuan
  deleteByPegawai: async (req, res) => {
    try {
      const pegawaiId = req.user.pegawai_id;
      if (!pegawaiId) {
        return res.status(403).json({ success: false, message: 'Akses ditolak' });
      }

      const result = await peminjamanService.deleteByPegawai(req.params.id, pegawaiId);
      res.json({ success: true, data: result, message: 'Peminjaman berhasil dibatalkan' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },
};

module.exports = peminjamanController;