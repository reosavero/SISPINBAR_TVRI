// ============================================
// EXPORT SERVICE - Sistem Peminjaman Barang TVRI
// Export laporan ke Excel
// Menampilkan: nama barang, gambar barang,
//   foto bukti peminjaman, foto bukti pengembalian
// ============================================

const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const { formatDate, formatDateTime } = require('../utils/helpers');

// Base directory for resolving image paths
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Resolve URL path to local file path
 * @param {string|null} urlPath - URL path like /uploads/barang/filename.jpg
 * @returns {string|null} Local file path or null if not available
 */
const resolveImagePath = (urlPath) => {
  if (!urlPath) return null;
  try {
    const relativePath = urlPath.startsWith('/') ? urlPath.slice(1) : urlPath;
    const localPath = path.join(__dirname, '..', relativePath);
    if (fs.existsSync(localPath)) {
      return localPath;
    }
  } catch (e) {
    // Ignore errors
  }
  return null;
};

/**
 * Get image buffer for embedding in documents
 * @param {string|null} urlPath - URL path like /uploads/barang/filename.jpg
 * @returns {Buffer|null} Image buffer or null
 */
const getImageBuffer = (urlPath) => {
  const localPath = resolveImagePath(urlPath);
  if (!localPath) return null;
  try {
    return fs.readFileSync(localPath);
  } catch (e) {
    return null;
  }
};

/**
 * Get image extension from URL path
 * @param {string|null} urlPath - URL path
 * @returns {string} Extension string (e.g., 'jpeg', 'png')
 */
const getImageExtension = (urlPath) => {
  if (!urlPath) return 'jpeg';
  const ext = path.extname(urlPath).toLowerCase().replace('.', '');
  if (ext === 'jpg') return 'jpeg';
  if (['jpeg', 'png', 'gif', 'webp'].includes(ext)) return ext;
  return 'jpeg';
};

// ==========================================
// EXPORT PEMINJAMAN
// ==========================================

const exportService = {

  // Ambil data peminjaman untuk export (termasuk foto)
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
      `SELECT p.id, p.nomor_peminjaman, p.pegawai_id, p.barang_id, p.jumlah,
              p.tanggal_pinjam, p.tanggal_kembali_rencana, p.keperluan, p.status,
              p.foto AS foto_peminjaman, p.created_at,
              u.nama AS pegawai_nama, u.nip AS pegawai_nip, u.divisi AS pegawai_divisi,
              b.nama_barang AS barang_nama, b.kode_barang, b.lokasi AS barang_lokasi, b.foto AS barang_foto,
              k.nama AS kategori_nama,
              pk_latest.tanggal_kembali_aktual, pk_latest.kondisi_barang AS kondisi_pengembalian,
              pk_latest.catatan AS catatan_pengembalian, pk_latest.foto AS foto_pengembalian, pk_latest.status AS pengembalian_status
       FROM peminjaman p
       LEFT JOIN users u ON p.pegawai_id = u.id
       LEFT JOIN barang b ON p.barang_id = b.id
       LEFT JOIN kategori k ON b.kategori_id = k.id
       LEFT JOIN (
         SELECT pk.*, ROW_NUMBER() OVER (PARTITION BY pk.peminjaman_id ORDER BY pk.created_at DESC) AS rn
         FROM pengembalian pk
       ) pk_latest ON pk_latest.peminjaman_id = p.id AND pk_latest.rn = 1
       ${whereClause}
       ORDER BY p.created_at DESC`,
      queryParams
    );

    return rows;
  },

  // Export Peminjaman ke Excel (dengan gambar)
  exportPeminjamanExcel: async (params = {}) => {
    const data = await exportService.getPeminjamanData(params);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SISPINBAR';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Laporan Peminjaman', {
      properties: { defaultColWidth: 18 },
    });

    // Header row styling
    const headerStyle = {
      font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF005BAC' } },
      alignment: { vertical: 'middle', horizontal: 'center', wrapText: true },
      border: {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      },
    };

    const dataStyle = {
      font: { size: 10 },
      alignment: { vertical: 'middle', wrapText: true },
      border: {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      },
    };

    // Title
    sheet.mergeCells('A1:O1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'LAPORAN PEMINJAMAN BARANG - TVRI JAWA TIMUR';
    titleCell.font = { bold: true, size: 14, color: { argb: 'FF005BAC' } };
    titleCell.alignment = { horizontal: 'center' };
    sheet.getRow(1).height = 30;

    sheet.mergeCells('A2:O2');
    const dateCell = sheet.getCell('A2');
    dateCell.value = `Dicetak: ${formatDateTime(new Date())}`;
    dateCell.font = { size: 10, color: { argb: 'FF666666' } };
    dateCell.alignment = { horizontal: 'center' };

    // Summary row
    const totalPeminjaman = data.length;
    const menunggu = data.filter(d => d.status === 'Menunggu Persetujuan').length;
    const dipinjam = data.filter(d => d.status === 'Dipinjam' || d.status === 'Disetujui').length;
    const dikembalikan = data.filter(d => d.status === 'Dikembalikan').length;

    sheet.mergeCells('A3:B3');
    sheet.getCell('A3').value = 'Total:';
    sheet.getCell('A3').font = { bold: true, size: 10 };
    sheet.getCell('C3').value = totalPeminjaman;
    sheet.getCell('C3').font = { bold: true, size: 10, color: { argb: 'FF005BAC' } };

    sheet.getCell('D3').value = 'Menunggu:';
    sheet.getCell('D3').font = { bold: true, size: 10 };
    sheet.getCell('E3').value = menunggu;
    sheet.getCell('E3').font = { bold: true, size: 10, color: { argb: 'FFF59E0B' } };

    sheet.getCell('F3').value = 'Dipinjam:';
    sheet.getCell('F3').font = { bold: true, size: 10 };
    sheet.getCell('G3').value = dipinjam;
    sheet.getCell('G3').font = { bold: true, size: 10, color: { argb: 'FF3B82F6' } };

    sheet.getCell('H3').value = 'Dikembalikan:';
    sheet.getCell('H3').font = { bold: true, size: 10 };
    sheet.getCell('I3').value = dikembalikan;
    sheet.getCell('I3').font = { bold: true, size: 10, color: { argb: 'FF10B981' } };

    // Headers (row 4)
    const headers = [
      'No', 'Nomor Peminjaman', 'Pegawai', 'NIP', 'Divisi',
      'Barang', 'Kategori', 'Jumlah', 'Tgl Pinjam', 'Tgl Kembali Rencana',
      'Status', 'Keperluan',
      'Foto Barang', 'Foto Bukti Peminjaman', 'Foto Bukti Pengembalian'
    ];
    const headerRow = sheet.getRow(4);
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      Object.assign(cell, headerStyle);
      cell.border = headerStyle.border;
    });
    headerRow.height = 25;

    // Image dimensions for Excel
    const imgWidth = 100;
    const imgHeight = 75;
    const rowHeightForImage = 80;

    // Data rows (starting row 5)
    data.forEach((item, idx) => {
      const rowNumber = idx + 5;
      const row = sheet.getRow(rowNumber);

      // Text data
      const textData = [
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
        item.keperluan || '-',
        null, // Foto Barang (will be image)
        null, // Foto Bukti Peminjaman (will be image)
        null, // Foto Bukti Pengembalian (will be image)
      ];

      textData.forEach((val, colIdx) => {
        const cell = row.getCell(colIdx + 1);
        cell.value = val;
        Object.assign(cell, dataStyle);
        cell.border = dataStyle.border;
        if (idx % 2 === 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } };
        }
      });

      // Style status column
      const statusCell = row.getCell(11);
      if (item.status) {
        const statusColors = {
          'Dikembalikan': 'FF059669',
          'Ditolak': 'FFDC2626',
          'Dipinjam': 'FFD97706',
          'Disetujui': 'FF3B82F6',
          'Menunggu Persetujuan': 'FF6B7280',
        };
        const color = statusColors[item.status];
        if (color) {
          statusCell.font = { bold: true, color: { argb: color }, size: 10 };
        }
      }

      // Set row height for images
      row.height = rowHeightForImage;

      // Embed images - Peminjaman Excel
      const imageFields = [
        { url: item.barang_foto, col: 13 },           // Column M - Foto Barang
        { url: item.foto_peminjaman || item.foto, col: 14 },  // Column N - Foto Bukti Peminjaman
        { url: item.foto_pengembalian, col: 15 },      // Column O - Foto Bukti Pengembalian
      ];

      imageFields.forEach(({ url, col }) => {
        const imgBuffer = getImageBuffer(url);
        if (imgBuffer) {
          try {
            const ext = getImageExtension(url);
            const imageId = workbook.addImage({
              extension: ext,
              buffer: imgBuffer,
            });

            sheet.addImage(imageId, {
              tl: { col: col - 1, row: rowNumber - 1 },
              ext: { width: imgWidth, height: imgHeight },
            });
          } catch (e) {
            // If image embedding fails, add text placeholder
            const cell = row.getCell(col);
            cell.value = 'Foto tidak tersedia';
            cell.font = { size: 8, color: { argb: 'FF9CA3AF' } };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          }
        } else {
          // No image - add text placeholder
          const cell = row.getCell(col);
          cell.value = url ? '(File tidak ditemukan)' : '-';
          cell.font = { size: 8, color: { argb: 'FF9CA3AF' } };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }
      });
    });

    // Set column widths
    const colWidths = [6, 20, 18, 15, 15, 22, 15, 8, 14, 16, 18, 25, 18, 20, 22];
    colWidths.forEach((w, i) => {
      sheet.getColumn(i + 1).width = w;
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
          WHERE p.barang_id = b.id AND p.status IN ('Menunggu Persetujuan', 'Disetujui', 'Dipinjam', 'Menunggu Konfirmasi')
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
    sheet.mergeCells('A1:I1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'LAPORAN DATA BARANG - TVRI JAWA TIMUR';
    titleCell.font = { bold: true, size: 14, color: { argb: 'FF005BAC' } };
    titleCell.alignment = { horizontal: 'center' };

    const headers = ['No', 'Kode Barang', 'Nama Barang', 'Kategori', 'Lokasi', 'Kondisi', 'Jumlah', 'Tersedia', 'Foto Barang'];
    const headerRow = sheet.getRow(3);
    const headerStyle = {
      font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF005BAC' } },
      alignment: { vertical: 'middle', horizontal: 'center' },
    };
    headerRow.eachCell((cell, colNumber) => {
      cell.value = headers[colNumber - 1];
      Object.assign(cell, headerStyle);
    });

    const imgWidth = 100;
    const imgHeight = 75;

    data.forEach((item, idx) => {
      const rowNumber = idx + 4;
      const row = sheet.getRow(rowNumber);

      row.getCell(1).value = idx + 1;
      row.getCell(2).value = item.kode_barang;
      row.getCell(3).value = item.nama_barang;
      row.getCell(4).value = item.kategori_nama || '-';
      row.getCell(5).value = item.lokasi || '-';
      row.getCell(6).value = item.kondisi;
      row.getCell(7).value = item.jumlah;
      row.getCell(8).value = Number(item.tersedia);
      row.getCell(9).value = null; // Foto placeholder

      row.height = 80;

      // Embed barang foto
      const imgBuffer = getImageBuffer(item.foto);
      if (imgBuffer) {
        try {
          const ext = getImageExtension(item.foto);
          const imageId = workbook.addImage({
            extension: ext,
            buffer: imgBuffer,
          });
          sheet.addImage(imageId, {
            tl: { col: 8, row: rowNumber - 1 },
            ext: { width: imgWidth, height: imgHeight },
          });
        } catch (e) {
          row.getCell(9).value = 'Foto tidak tersedia';
          row.getCell(9).font = { size: 8, color: { argb: 'FF9CA3AF' } };
        }
      } else {
        row.getCell(9).value = item.foto ? '(File tidak ditemukan)' : '-';
        row.getCell(9).font = { size: 8, color: { argb: 'FF9CA3AF' } };
        row.getCell(9).alignment = { vertical: 'middle', horizontal: 'center' };
      }
    });

    sheet.columns.forEach((column) => { column.width = 18; });
    sheet.getColumn(9).width = 22;

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  },

  // ========== EXPORT RIWAYAT ==========

  // Ambil data riwayat untuk export (termasuk foto)
  getRiwayatData: async (params = {}) => {
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
    if (params.search) {
      whereConditions.push('(u.nama LIKE ? OR p.nomor_peminjaman LIKE ? OR b.nama_barang LIKE ?)');
      queryParams.push(`%${params.search}%`, `%${params.search}%`, `%${params.search}%`);
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
      `SELECT p.id, p.nomor_peminjaman, p.pegawai_id, p.barang_id, p.jumlah,
              p.tanggal_pinjam, p.tanggal_kembali_rencana, p.keperluan, p.status,
              p.foto AS foto_peminjaman, p.created_at,
              u.nama AS pegawai_nama, u.nip AS pegawai_nip, u.divisi AS pegawai_divisi,
              b.nama_barang AS barang_nama, b.kode_barang, b.lokasi AS barang_lokasi, b.foto AS barang_foto,
              k.nama AS kategori_nama,
              pk_latest.tanggal_kembali_aktual, pk_latest.kondisi_barang AS kondisi_pengembalian,
              pk_latest.catatan AS catatan_pengembalian, pk_latest.foto AS foto_pengembalian, pk_latest.status AS pengembalian_status
       FROM peminjaman p
       LEFT JOIN users u ON p.pegawai_id = u.id
       LEFT JOIN barang b ON p.barang_id = b.id
       LEFT JOIN kategori k ON b.kategori_id = k.id
       LEFT JOIN (
         SELECT pk.*, ROW_NUMBER() OVER (PARTITION BY pk.peminjaman_id ORDER BY pk.created_at DESC) AS rn
         FROM pengembalian pk
       ) pk_latest ON pk_latest.peminjaman_id = p.id AND pk_latest.rn = 1
       ${whereClause}
       ORDER BY p.created_at DESC`,
      queryParams
    );

    return rows;
  },

  // Export Riwayat ke Excel (dengan gambar)
  exportRiwayatExcel: async (params = {}) => {
    const data = await exportService.getRiwayatData(params);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SISPINBAR';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Laporan Riwayat', {
      properties: { defaultColWidth: 18 },
    });

    // Header style
    const headerStyle = {
      font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF005BAC' } },
      alignment: { vertical: 'middle', horizontal: 'center', wrapText: true },
      border: {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      },
    };

    const dataStyle = {
      font: { size: 10 },
      alignment: { vertical: 'middle', wrapText: true },
      border: {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      },
    };

    // Title
    sheet.mergeCells('A1:P1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'LAPORAN RIWAYAT TRANSAKSI - TVRI JAWA TIMUR';
    titleCell.font = { bold: true, size: 14, color: { argb: 'FF005BAC' } };
    titleCell.alignment = { horizontal: 'center' };
    sheet.getRow(1).height = 30;

    sheet.mergeCells('A2:P2');
    const dateCell = sheet.getCell('A2');
    dateCell.value = `Dicetak: ${formatDateTime(new Date())}`;
    dateCell.font = { size: 10, color: { argb: 'FF666666' } };
    dateCell.alignment = { horizontal: 'center' };

    // Summary row
    const total = data.length;
    const dikembalikan = data.filter(d => d.status === 'Dikembalikan').length;
    const dipinjam = data.filter(d => d.status === 'Dipinjam' || d.status === 'Disetujui').length;
    const ditolak = data.filter(d => d.status === 'Ditolak').length;

    sheet.mergeCells('A3:B3');
    sheet.getCell('A3').value = 'Total:';
    sheet.getCell('A3').font = { bold: true, size: 10 };
    sheet.getCell('C3').value = total;
    sheet.getCell('C3').font = { bold: true, size: 10, color: { argb: 'FF005BAC' } };

    sheet.getCell('D3').value = 'Dikembalikan:';
    sheet.getCell('D3').font = { bold: true, size: 10 };
    sheet.getCell('E3').value = dikembalikan;
    sheet.getCell('E3').font = { bold: true, size: 10, color: { argb: 'FF10B981' } };

    sheet.getCell('F3').value = 'Dipinjam:';
    sheet.getCell('F3').font = { bold: true, size: 10 };
    sheet.getCell('G3').value = dipinjam;
    sheet.getCell('G3').font = { bold: true, size: 10, color: { argb: 'FF3B82F6' } };

    sheet.getCell('H3').value = 'Ditolak:';
    sheet.getCell('H3').font = { bold: true, size: 10 };
    sheet.getCell('I3').value = ditolak;
    sheet.getCell('I3').font = { bold: true, size: 10, color: { argb: 'FFEF4444' } };

    // Headers (row 4)
    const headers = [
      'No', 'Nomor Peminjaman', 'Pegawai', 'NIP', 'Divisi',
      'Barang', 'Kategori', 'Jumlah', 'Tgl Pinjam', 'Tgl Kembali Rencana',
      'Tgl Kembali Aktual', 'Status', 'Keperluan',
      'Foto Barang', 'Foto Bukti Peminjaman', 'Foto Bukti Pengembalian'
    ];
    const headerRow = sheet.getRow(4);
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      Object.assign(cell, headerStyle);
      cell.border = headerStyle.border;
    });
    headerRow.height = 25;

    // Image dimensions
    const imgWidth = 100;
    const imgHeight = 75;
    const rowHeightForImage = 80;

    // Data rows
    data.forEach((item, idx) => {
      const rowNumber = idx + 5;
      const row = sheet.getRow(rowNumber);

      const textData = [
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
        item.tanggal_kembali_aktual ? formatDate(item.tanggal_kembali_aktual) : '-',
        item.status || '-',
        item.keperluan || '-',
        null, // Foto Barang
        null, // Foto Bukti Peminjaman
        null, // Foto Bukti Pengembalian
      ];

      textData.forEach((val, colIdx) => {
        const cell = row.getCell(colIdx + 1);
        cell.value = val;
        Object.assign(cell, dataStyle);
        cell.border = dataStyle.border;
        if (idx % 2 === 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } };
        }
      });

      // Style status column
      const statusCell = row.getCell(12);
      if (item.status) {
        const statusColors = {
          'Dikembalikan': 'FF059669',
          'Ditolak': 'FFDC2626',
          'Dipinjam': 'FFD97706',
          'Disetujui': 'FF3B82F6',
          'Menunggu Persetujuan': 'FF6B7280',
        };
        const color = statusColors[item.status];
        if (color) {
          statusCell.font = { bold: true, color: { argb: color }, size: 10 };
        }
      }

      // Set row height for images
      row.height = rowHeightForImage;

      // Embed images - Riwayat Excel
      const imageFields = [
        { url: item.barang_foto, col: 14 },              // Column N - Foto Barang
        { url: item.foto_peminjaman || item.foto, col: 15 },    // Column O - Foto Bukti Peminjaman
        { url: item.foto_pengembalian, col: 16 },         // Column P - Foto Bukti Pengembalian
      ];

      imageFields.forEach(({ url, col }) => {
        const imgBuffer = getImageBuffer(url);
        if (imgBuffer) {
          try {
            const ext = getImageExtension(url);
            const imageId = workbook.addImage({
              extension: ext,
              buffer: imgBuffer,
            });

            sheet.addImage(imageId, {
              tl: { col: col - 1, row: rowNumber - 1 },
              ext: { width: imgWidth, height: imgHeight },
            });
          } catch (e) {
            const cell = row.getCell(col);
            cell.value = 'Foto tidak tersedia';
            cell.font = { size: 8, color: { argb: 'FF9CA3AF' } };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          }
        } else {
          const cell = row.getCell(col);
          cell.value = url ? '(File tidak ditemukan)' : '-';
          cell.font = { size: 8, color: { argb: 'FF9CA3AF' } };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }
      });
    });

    // Set column widths
    const colWidths = [6, 20, 18, 15, 15, 22, 15, 8, 14, 16, 16, 18, 25, 18, 20, 22];
    colWidths.forEach((w, i) => {
      sheet.getColumn(i + 1).width = w;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  },
};

module.exports = exportService;