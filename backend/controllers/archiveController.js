

const archiveService = require('../services/archiveService');
const auditService = require('../services/auditService');

const archiveController = {

  
  getArchiveYears: async (req, res) => {
    try {
      const years = await archiveService.getArchiveYears();
      res.json({ success: true, data: years });
    } catch (error) {
      console.error('Get archive years error:', error);
      res.status(500).json({ success: false, message: 'Gagal memuat tahun arsip' });
    }
  },

  
  getArchiveMonths: async (req, res) => {
    try {
      const { year } = req.query;
      if (!year) {
        return res.status(400).json({ success: false, message: 'Parameter tahun diperlukan' });
      }
      const months = await archiveService.getArchiveMonths(parseInt(year));
      res.json({ success: true, data: months });
    } catch (error) {
      console.error('Get archive months error:', error);
      res.status(500).json({ success: false, message: 'Gagal memuat bulan arsip' });
    }
  },

  
  getArchiveData: async (req, res) => {
    try {
      const { year, month, page = 1 } = req.query;
      if (!year || !month) {
        return res.status(400).json({ success: false, message: 'Parameter tahun dan bulan diperlukan' });
      }
      const result = await archiveService.getArchiveData(
        parseInt(year), parseInt(month), parseInt(page), 10
      );
      res.json({ success: true, ...result });
    } catch (error) {
      console.error('Get archive data error:', error);
      res.status(500).json({ success: false, message: 'Gagal memuat data arsip' });
    }
  },

  
  triggerArchive: async (req, res) => {
    try {
      const result = await archiveService.archivePreviousMonths();

      await auditService.log({
        userId: req.user.id,
        username: req.user.username,
        action: 'ARCHIVE',
        module: 'riwayat',
        details: { archived: result.archived, month: result.currentMonth, year: result.currentYear },
        ipAddress: req.ip,
      });

      res.json({ success: true, data: result });
    } catch (error) {
      console.error('Archive trigger error:', error);
      res.status(500).json({ success: false, message: 'Gagal mengarsipkan data' });
    }
  },

  
  exportArchiveExcel: async (req, res) => {
    try {
      const { year, month } = req.query;
      if (!year || !month) {
        return res.status(400).json({ success: false, message: 'Parameter tahun dan bulan diperlukan' });
      }

      const buffer = await archiveService.exportArchiveExcel(parseInt(year), parseInt(month));

      await auditService.log({
        userId: req.user.id,
        username: req.user.username,
        action: 'EXPORT_ARCHIVE',
        module: 'riwayat',
        details: { format: 'excel', year: parseInt(year), month: parseInt(month) },
        ipAddress: req.ip,
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=arsip-riwayat-${year}-${month.padStart(2, '0')}.xlsx`);
      res.send(buffer);
    } catch (error) {
      console.error('Export archive Excel error:', error);
      res.status(500).json({ success: false, message: 'Gagal mengekspor arsip Excel' });
    }
  },
};

module.exports = archiveController;