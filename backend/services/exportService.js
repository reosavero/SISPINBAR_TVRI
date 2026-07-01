// ============================================
// EXPORT SERVICE - Sistem Peminjaman Barang TVRI
// Export laporan ke PDF dan Excel
// ============================================

const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const pool = require('../config/db');
const { formatDate, formatDateTime } = require('../utils/helpers');

const exportService = {
  // ========== EXPORT PEMINJAMAN ==========

  // Ambil data peminjaman untuk export
  getPeminjamanData: async (params = {}) => {
    let whereConditions = [];
    let queryParams = [];

    if (params.status) {
      const statuses = params.status.split(',');
      const placeholders = statuses.map(() => '?').join(', ');
      whereConditions.push(`p.status IN (${placeholders})`);
      queryParams.push(...statuses);
    }
    if (params.pegawai_id) {
      whereConditions.push('p.pegawai_id = ?');
      queryParams.push(params.pegawai_id);
    }
    if (params.startDate) {
      whereConditions.push('p.tanggal_pinjam >= ?');
      queryParams.push(params.startDate);
    }
    if (params.endDate) {
      whereConditions.push('p.tanggal_pinjam <= ?');
      queryParams.push(params.endDate);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    const [rows] = await pool.execute(
      `SELECT p.*, pg.nama AS pegawai_nama, pg.nip AS pegawai_nip, pg.divisi AS pegawai_divisi,
              b.nama_barang, b.kode_barang, b.lokasi AS barang_lokasi,
              k.nama AS kategori_nama,
              pk.tanggal_kembali_aktual, pk.kondisi_barang AS kondisi_pengembalian, pk.catatan AS catatan_pengembalian
       FROM peminjaman p
       LEFT JOIN pegawai pg ON p.pegawai_id = pg.id
       LEFT JOIN barang b ON p.barang_id = b.id
       LEFT JOIN kategori k ON b.kategori_id = k.id
       LEFT JOIN pengembalian pk ON pk.peminjaman_id = p.id
       ${whereClause}
       ORDER BY p.created_at DESC`,
      queryParams
    );

    return rows;
  },

  // Export Peminjaman ke PDF
  exportPeminjamanPDF: async (params = {}) => {
    const data = await exportService.getPeminjamanData(params);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const buffers = [];
      doc.on('data', (buffer) => buffers.push(buffer));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Header
      doc.fontSize(16).font('Helvetica-Bold').text('LAPORAN PEMINJAMAN BARANG', { align: 'center' });
      doc.fontSize(11).font('Helvetica').text('TVRI Jawa Timur', { align: 'center' });
      doc.fontSize(9).text(`Dicetak: ${formatDateTime(new Date())}`, { align: 'center' });
      doc.moveDown(1.5);

      // Filter info
      if (params.startDate || params.endDate) {
        doc.fontSize(9).text(`Periode: ${params.startDate || 'Awal'} s/d ${params.endDate || 'Akhir'}`, { align: 'center' });
        doc.moveDown(0.5);
      }

      // Summary
      const totalPeminjaman = data.length;
      const menunggu = data.filter(d => d.status === 'Menunggu Persetujuan').length;
      const dipinjam = data.filter(d => d.status === 'Dipinjam').length;
      const dikembalikan = data.filter(d => d.status === 'Dikembalikan').length;
      const ditolak = data.filter(d => d.status === 'Ditolak').length;

      doc.fontSize(9).font('Helvetica-Bold').text('Ringkasan:', { continued: false });
      doc.font('Helvetica').text(`Total: ${totalPeminjaman} | Menunggu: ${menunggu} | Dipinjam: ${dipinjam} | Dikembalikan: ${dikembalikan} | Ditolak: ${ditolak}`);
      doc.moveDown(1);

      // Table
      if (data.length === 0) {
        doc.fontSize(10).text('Tidak ada data peminjaman.', { align: 'center' });
      } else {
        const tableTop = doc.y;
        const colWidths = [30, 110, 110, 65, 70, 65, 70];
        const headers = ['No', 'Nomor', 'Pegawai', 'Barang', 'Tgl Pinjam', 'Status', 'Tgl Kembali'];

        // Header row
        doc.rect(50, tableTop, 495, 20).fill('#005BAC');
        let xPos = 50;
        headers.forEach((header, i) => {
          doc.fontSize(7).font('Helvetica-Bold').fillColor('white').text(header, xPos + 3, tableTop + 5, { width: colWidths[i] - 6 });
          xPos += colWidths[i];
        });
        doc.fillColor('black');

        // Data rows
        let yPos = tableTop + 20;
        data.forEach((item, idx) => {
          if (yPos > 720) {
            doc.addPage();
            yPos = 50;
          }

          const bgColor = idx % 2 === 0 ? '#F8F9FA' : '#FFFFFF';
          doc.rect(50, yPos, 495, 18).fill(bgColor);

          xPos = 50;
          const rowData = [
            String(idx + 1),
            item.nomor_peminjaman || '-',
            item.pegawai_nama || '-',
            item.barang_nama || '-',
            formatDate(item.tanggal_pinjam),
            item.status || '-',
            formatDate(item.tanggal_kembali_rencana),
          ];

          rowData.forEach((cell, i) => {
            doc.fontSize(7).font('Helvetica').fillColor('#333333').text(cell, xPos + 3, yPos + 4, { width: colWidths[i] - 6 });
            xPos += colWidths[i];
          });
          doc.fillColor('black');
          yPos += 18;
        });
      }

      // Footer
      const pageCount = doc.bufferedPageRange().count;
      doc.fontSize(8).font('Helvetica').text(
        `SISPINBAR - Sistem Peminjaman Barang TVRI Jawa Timur | Halaman ${1} dari ${pageCount}`,
        50, 780, { align: 'center', width: 495 }
      );

      doc.end();
    });
  },

  // Export Peminjaman ke Excel
  exportPeminjamanExcel: async (params = {}) => {
    const data = await exportService.getPeminjamanData(params);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SISPINBAR';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Laporan Peminjaman', {
      properties: { defaultColWidth: 20 },
    });

    // Header row styling
    const headerStyle = {
      font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF005BAC' } },
      alignment: { vertical: 'middle', horizontal: 'center' },
      border: {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      },
    };

    // Title
    sheet.mergeCells('A1:K1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'LAPORAN PEMINJAMAN BARANG - TVRI JAWA TIMUR';
    titleCell.font = { bold: true, size: 14, color: { argb: 'FF005BAC' } };
    titleCell.alignment = { horizontal: 'center' };

    sheet.mergeCells('A2:K2');
    const dateCell = sheet.getCell('A2');
    dateCell.value = `Dicetak: ${formatDateTime(new Date())}`;
    dateCell.font = { size: 10, color: { argb: 'FF666666' } };
    dateCell.alignment = { horizontal: 'center' };

    // Headers
    const headers = [
      'No', 'Nomor Peminjaman', 'Pegawai', 'NIP', 'Divisi',
      'Barang', 'Kategori', 'Jumlah', 'Tgl Pinjam', 'Tgl Kembali Rencana', 'Status'
    ];
    const headerRow = sheet.addRow(headers);
    headerRow.eachCell((cell) => {
      Object.assign(cell, headerStyle);
      cell.border = headerStyle.border;
    });

    // Data
    data.forEach((item, idx) => {
      const row = sheet.addRow([
        idx + 1,
        item.nomor_peminjaman || '-',
        item.pegawai_nama || '-',
        item.pegawai_nip || '-',
        item.pegawai_divisi || '-',
        item.barang_nama || '-',
        item.kategori_nama || '-',
        item.jumlah || 1,
        formatDate(item.tanggal_pinjam),
        formatDate(item.tanggal_kembali_rencana),
        item.status || '-',
      ]);

      row.eachCell((cell, colNumber) => {
        cell.font = { size: 10 };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        };
        if (idx % 2 === 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } };
        }
      });
    });

    // Auto-fit columns
    sheet.columns.forEach((column) => {
      let maxLength = 10;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const columnLength = cell.value ? String(cell.value).length + 2 : 10;
        if (columnLength > maxLength) maxLength = columnLength;
      });
      column.width = Math.min(maxLength, 30);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  },

  // ========== EXPORT BARANG ==========

  exportBarangExcel: async (params = {}) => {
    let whereConditions = [];
    let queryParams = [];

    if (params.kategori) {
      whereConditions.push('b.kategori_id = ?');
      queryParams.push(params.kategori);
    }
    if (params.status) {
      whereConditions.push('b.status = ?');
      queryParams.push(params.status);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    const [data] = await pool.execute(
      `SELECT b.*, k.nama AS kategori_nama,
        (b.jumlah - COALESCE((
          SELECT SUM(p.jumlah) FROM peminjaman p
          WHERE p.barang_id = b.id AND p.status IN ('Menunggu Persetujuan', 'Disetujui', 'Dipinjam')
        ), 0)) AS tersedia
       FROM barang b
       LEFT JOIN kategori k ON b.kategori_id = k.id
       ${whereClause}
       WHERE b.deleted_at IS NULL
       ORDER BY b.nama_barang ASC`,
      queryParams
    );

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SISPINBAR';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Laporan Barang', {
      properties: { defaultColWidth: 20 },
    });

    // Title
    sheet.mergeCells('A1:H1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'LAPORAN DATA BARANG - TVRI JAWA TIMUR';
    titleCell.font = { bold: true, size: 14, color: { argb: 'FF005BAC' } };
    titleCell.alignment = { horizontal: 'center' };

    const headers = ['No', 'Kode Barang', 'Nama Barang', 'Kategori', 'Lokasi', 'Kondisi', 'Jumlah', 'Tersedia'];
    const headerRow = sheet.addRow(headers);
    const headerStyle = {
      font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF005BAC' } },
      alignment: { vertical: 'middle', horizontal: 'center' },
    };
    headerRow.eachCell((cell) => {
      Object.assign(cell, headerStyle);
    });

    data.forEach((item, idx) => {
      sheet.addRow([
        idx + 1,
        item.kode_barang,
        item.nama_barang,
        item.kategori_nama || '-',
        item.lokasi || '-',
        item.kondisi,
        item.jumlah,
        Number(item.tersedia),
      ]);
    });

    sheet.columns.forEach((column) => { column.width = 18; });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  },
};

module.exports = exportService;