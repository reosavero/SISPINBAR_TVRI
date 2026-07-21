

const express = require('express');
const router = express.Router();
const { auth, adminAndAbove } = require('../middleware/auth');
const exportController = require('../controllers/exportController');

router.use(auth);

router.get('/peminjaman/excel', adminAndAbove, exportController.exportPeminjamanExcel);

router.get('/barang/excel', adminAndAbove, exportController.exportBarangExcel);

router.get('/riwayat/excel', adminAndAbove, exportController.exportRiwayatExcel);

module.exports = router;