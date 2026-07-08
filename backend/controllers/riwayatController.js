// ============================================
// RIWAYAT CONTROLLER - Sistem Peminjaman Barang TVRI
// Delete riwayat records (super_admin only)
// ============================================

const riwayatService = require('../services/riwayatService');
const auditService = require('../services/auditService');

const riwayatController = {

  // Delete a single riwayat record
  deleteRecord: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ success: false, message: 'ID tidak valid' });
      }

      const result = await riwayatService.deleteRecord(parseInt(id));

      await auditService.log({
        userId: req.user.id,
        username: req.user.username,
        action: 'DELETE_RIWAYAT',
        module: 'riwayat',
        recordId: id,
        details: {
          nomor_peminjaman: result.nomor_peminjaman,
          method: 'single_delete',
        },
        ipAddress: req.ip,
      });

      res.json({
        success: true,
        message: `Riwayat peminjaman ${result.nomor_peminjaman} berhasil dihapus`,
        data: result,
      });
    } catch (error) {
      console.error('Delete riwayat error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  },

  // Bulk delete riwayat for a given month/year
  deleteBulkByMonth: async (req, res) => {
    try {
      const { year, month } = req.body;

      if (!year || !month) {
        return res.status(400).json({ success: false, message: 'Parameter tahun dan bulan diperlukan' });
      }

      const yearNum = parseInt(year);
      const monthNum = parseInt(month);

      if (yearNum < 2020 || yearNum > 2100) {
        return res.status(400).json({ success: false, message: 'Tahun tidak valid' });
      }
      if (monthNum < 1 || monthNum > 12) {
        return res.status(400).json({ success: false, message: 'Bulan tidak valid' });
      }

      const result = await riwayatService.deleteBulkByMonth(yearNum, monthNum);

      await auditService.log({
        userId: req.user.id,
        username: req.user.username,
        action: 'DELETE_RIWAYAT_BULK',
        module: 'riwayat',
        details: {
          year: yearNum,
          month: monthNum,
          deleted: result.deleted,
          method: 'bulk_delete',
        },
        ipAddress: req.ip,
      });

      res.json({
        success: true,
        message: `Berhasil menghapus ${result.deleted} riwayat pada bulan ${monthNum}/${yearNum}`,
        data: result,
      });
    } catch (error) {
      console.error('Bulk delete riwayat error:', error);
      res.status(500).json({ success: false, message: 'Gagal menghapus riwayat secara massal' });
    }
  },

  // Count records that will be deleted in bulk (preview)
  countBulkByMonth: async (req, res) => {
    try {
      const { year, month } = req.query;

      if (!year || !month) {
        return res.status(400).json({ success: false, message: 'Parameter tahun dan bulan diperlukan' });
      }

      const result = await riwayatService.countBulkByMonth(parseInt(year), parseInt(month));

      res.json({ success: true, data: result });
    } catch (error) {
      console.error('Count bulk riwayat error:', error);
      res.status(500).json({ success: false, message: 'Gagal menghitung data' });
    }
  },
};

module.exports = riwayatController;