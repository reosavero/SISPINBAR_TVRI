

const pool = require('../config/db');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const { formatDate, formatDateTime } = require('../utils/helpers');

const resolveImagePath = (urlPath) => {
  if (!urlPath) return null;
  try {
    const relativePath = urlPath.startsWith('/') ? urlPath.slice(1) : urlPath;
    const localPath = path.join(__dirname, '..', relativePath);
    if (fs.existsSync(localPath)) return localPath;
  } catch (e) {}
  return null;
};

const getImageBuffer = (urlPath) => {
  const localPath = resolveImagePath(urlPath);
  if (!localPath) return null;
  try { return fs.readFileSync(localPath); } catch (e) { return null; }
};

const getImageExtension = (urlPath) => {
  if (!urlPath) return 'jpeg';
  const ext = path.extname(urlPath).toLowerCase().replace('.', '');
  if (ext === 'jpg') return 'jpeg';
  if (['jpeg', 'png', 'gif', 'webp'].includes(ext)) return ext;
  return 'jpeg';
};

const BULAN_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const archiveService = {

  
  
  
  
  archivePreviousMonths: async () => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; 
    const currentYear = now.getFullYear();

    
    
    const [result] = await pool.execute(
      `UPDATE peminjaman
       SET archived_at = NOW()
       WHERE archived_at IS NULL
         AND (
           YEAR(tanggal_pinjam) < ?
           OR (YEAR(tanggal_pinjam) = ? AND MONTH(tanggal_pinjam) < ?)
         )`,
      [currentYear, currentYear, currentMonth]
    );

    return { archived: result.affectedRows, currentMonth, currentYear };
  },

  
  
  
  getArchiveYears: async () => {
    const [rows] = await pool.execute(
      `SELECT DISTINCT YEAR(tanggal_pinjam) AS tahun
       FROM peminjaman
       WHERE archived_at IS NOT NULL
       ORDER BY tahun DESC`
    );
    return rows.map(r => r.tahun);
  },

  
  
  
  getArchiveMonths: async (year) => {
    const [rows] = await pool.execute(
      `SELECT DISTINCT MONTH(tanggal_pinjam) AS bulan,
              COUNT(*) AS total_transaksi
       FROM peminjaman
       WHERE archived_at IS NOT NULL
         AND YEAR(tanggal_pinjam) = ?
       GROUP BY MONTH(tanggal_pinjam)
       ORDER BY bulan DESC`,
      [year]
    );
    return rows.map(r => ({
      bulan: r.bulan,
      nama_bulan: BULAN_NAMES[r.bulan - 1],
      total_transaksi: r.total_transaksi,
    }));
  },

  
  
  
  getArchiveData: async (year, month, page = 1, limit = 10) => {
    const offset = (page - 1) * limit;

    const [rows] = await pool.execute(
      `SELECT p.id, p.nomor_peminjaman, p.pegawai_id, p.barang_id, p.jumlah,
              p.tanggal_pinjam, p.tanggal_kembali_rencana, p.keperluan, p.status,
              p.foto AS foto_peminjaman, p.archived_at,
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
       WHERE p.archived_at IS NOT NULL
         AND YEAR(p.tanggal_pinjam) = ?
         AND MONTH(p.tanggal_pinjam) = ?
       ORDER BY p.tanggal_pinjam DESC
       LIMIT ? OFFSET ?`,
      [year, month, limit, offset]
    );

    const [countResult] = await pool.execute(
      `SELECT COUNT(*) AS total
       FROM peminjaman
       WHERE archived_at IS NOT NULL
         AND YEAR(tanggal_pinjam) = ?
         AND MONTH(tanggal_pinjam) = ?`,
      [year, month]
    );

    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    
    const dikembalikan = rows.filter(r => r.status === 'Dikembalikan').length;
    const dipinjam = rows.filter(r => r.status === 'Dipinjam' || r.status === 'Disetujui').length;
    const ditolak = rows.filter(r => r.status === 'Ditolak').length;
    const menunggu = rows.filter(r => r.status === 'Menunggu Persetujuan').length;

    return {
      data: rows,
      pagination: { page, totalPages, totalItems, itemsPerPage: limit },
      summary: {
        total: totalItems,
        dikembalikan,
        dipinjam,
        ditolak,
        menunggu,
      },
    };
  },

  
  
  
  exportArchiveExcel: async (year, month) => {
    
    const [data] = await pool.execute(
      `SELECT p.id, p.nomor_peminjaman, p.pegawai_id, p.barang_id, p.jumlah,
              p.tanggal_pinjam, p.tanggal_kembali_rencana, p.keperluan, p.status,
              p.foto AS foto_peminjaman, p.archived_at,
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
       WHERE p.archived_at IS NOT NULL
         AND YEAR(p.tanggal_pinjam) = ?
         AND MONTH(p.tanggal_pinjam) = ?
       ORDER BY p.tanggal_pinjam DESC`,
      [year, month]
    );

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SISPINBAR';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(`Arsip ${BULAN_NAMES[month - 1]} ${year}`, {
      properties: { defaultColWidth: 18 },
    });

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

    
    const lastCol = 'P';
    sheet.mergeCells(`A1:${lastCol}1`);
    const titleCell = sheet.getCell('A1');
    titleCell.value = `ARSIP RIWAYAT TRANSAKSI - ${BULAN_NAMES[month - 1].toUpperCase()} ${year}`;
    titleCell.font = { bold: true, size: 14, color: { argb: 'FF005BAC' } };
    titleCell.alignment = { horizontal: 'center' };
    sheet.getRow(1).height = 30;

    sheet.mergeCells(`A2:${lastCol}2`);
    const dateCell = sheet.getCell('A2');
    dateCell.value = `Diekspor: ${formatDateTime(new Date())}`;
    dateCell.font = { size: 10, color: { argb: 'FF666666' } };
    dateCell.alignment = { horizontal: 'center' };

    
    const dikembalikan = data.filter(d => d.status === 'Dikembalikan').length;
    const dipinjam = data.filter(d => d.status === 'Dipinjam' || d.status === 'Disetujui').length;
    const ditolak = data.filter(d => d.status === 'Ditolak').length;

    sheet.mergeCells('A3:B3');
    sheet.getCell('A3').value = 'Total:';
    sheet.getCell('A3').font = { bold: true, size: 10 };
    sheet.getCell('C3').value = data.length;
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

    const imgWidth = 100;
    const imgHeight = 75;

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
        null, null, null,
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

      
      const statusCell = row.getCell(12);
      if (item.status) {
        const statusColors = {
          'Dikembalikan': 'FF059669', 'Ditolak': 'FFDC2626', 'Dipinjam': 'FFD97706',
          'Disetujui': 'FF3B82F6', 'Menunggu Persetujuan': 'FF6B7280',
        };
        const color = statusColors[item.status];
        if (color) statusCell.font = { bold: true, color: { argb: color }, size: 10 };
      }

      row.height = 80;

      
      const imageFields = [
        { url: item.barang_foto, col: 14 },
        { url: item.foto_peminjaman || item.foto, col: 15 },
        { url: item.foto_pengembalian, col: 16 },
      ];

      imageFields.forEach(({ url, col }) => {
        const imgBuffer = getImageBuffer(url);
        if (imgBuffer) {
          try {
            const ext = getImageExtension(url);
            const imageId = workbook.addImage({ extension: ext, buffer: imgBuffer });
            sheet.addImage(imageId, { tl: { col: col - 1, row: rowNumber - 1 }, ext: { width: imgWidth, height: imgHeight } });
          } catch (e) {
            row.getCell(col).value = 'Foto tidak tersedia';
            row.getCell(col).font = { size: 8, color: { argb: 'FF9CA3AF' } };
            row.getCell(col).alignment = { vertical: 'middle', horizontal: 'center' };
          }
        } else {
          row.getCell(col).value = url ? '(File tidak ditemukan)' : '-';
          row.getCell(col).font = { size: 8, color: { argb: 'FF9CA3AF' } };
          row.getCell(col).alignment = { vertical: 'middle', horizontal: 'center' };
        }
      });
    });

    const colWidths = [6, 20, 18, 15, 15, 22, 15, 8, 14, 16, 16, 18, 25, 18, 20, 22];
    colWidths.forEach((w, i) => { sheet.getColumn(i + 1).width = w; });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  },
};

module.exports = archiveService;