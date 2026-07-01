// ============================================
// EXPORT CONTROLLER - Sistem Peminjaman Barang TVRI
// ============================================

const exportService = require('../services/exportService');
const auditService = require('../services/auditService');

const exportController = {
  // Export Peminjaman ke PDF
  exportPeminjamanPDF: async (req, res) => {
    try {
      const params = { ...req.query };
      // Pegawai hanya bisa export data miliknya
      if (req.user.role !== 'admin' && req.user.pegawai_id) {
        params.pegawai_id = req.user.pegawai_id;
      }

      const buffer = await exportService.exportPeminjamanPDF(params);

      // Audit log
      await auditService.log({
        userId: req.user.id,
        username: req.user.username,
        action: 'EXPORT',
        module: 'peminjaman',
        details: { format: 'pdf', filters: params },
        ipAddress: req.ip,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=laporan-peminjaman.pdf');
      res.send(buffer);
    } catch (error) {
      console.error('Export PDF error:', error);
      res.status(500).json({ success: false, message: 'Gagal mengekspor PDF' });
    }
  },

  // Export Peminjaman ke Excel
  exportPeminjamanExcel: async (req, res) => {
    try {
      const params = { ...req.query };
      if (req.user.role !== 'admin' && req.user.pegawai_id) {
        params.pegawai_id = req.user.pegawai_id;
      }

      const buffer = await exportService.exportPeminjamanExcel(params);

      // Audit log
      await auditService.log({
        userId: req.user.id,
        username: req.user.username,
        action: 'EXPORT',
        module: 'peminjaman',
        details: { format: 'excel', filters: params },
        ipAddress: req.ip,
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=laporan-peminjaman.xlsx');
      res.send(buffer);
    } catch (error) {
      console.error('Export Excel error:', error);
      res.status(500).json({ success: false, message: 'Gagal mengekspor Excel' });
    }
  },

  // Export Barang ke Excel
  exportBarangExcel: async (req, res) => {
    try {
      const params = { ...req.query };

      const buffer = await exportService.exportBarangExcel(params);

      // Audit log
      await auditService.log({
        userId: req.user.id,
        username: req.user.username,
        action: 'EXPORT',
        module: 'barang',
        details: { format: 'excel', filters: params },
        ipAddress: req.ip,
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=laporan-barang.xlsx');
      res.send(buffer);
    } catch (error) {
      console.error('Export Barang Excel error:', error);
      res.status(500).json({ success: false, message: 'Gagal mengekspor Excel' });
    }
  },
};

module.exports = exportController;