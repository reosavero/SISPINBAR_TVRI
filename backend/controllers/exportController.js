

const exportService = require('../services/exportService');
const auditService = require('../services/auditService');

const exportController = {
  
  exportPeminjamanExcel: async (req, res) => {
    try {
      const params = { ...req.query };
      
      if (req.user.role === 'pegawai') {
        params.pegawai_id = req.user.id;
      }

      const buffer = await exportService.exportPeminjamanExcel(params);

      
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

  
  exportBarangExcel: async (req, res) => {
    try {
      const params = { ...req.query };

      const buffer = await exportService.exportBarangExcel(params);

      
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

  
  exportRiwayatExcel: async (req, res) => {
    try {
      const params = { ...req.query };
      if (req.user.role === 'pegawai') {
        params.pegawai_id = req.user.id;
      }

      const buffer = await exportService.exportRiwayatExcel(params);

      await auditService.log({
        userId: req.user.id,
        username: req.user.username,
        action: 'EXPORT',
        module: 'riwayat',
        details: { format: 'excel', filters: params },
        ipAddress: req.ip,
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=laporan-riwayat.xlsx');
      res.send(buffer);
    } catch (error) {
      console.error('Export Riwayat Excel error:', error);
      res.status(500).json({ success: false, message: 'Gagal mengekspor Excel' });
    }
  },
};

module.exports = exportController;