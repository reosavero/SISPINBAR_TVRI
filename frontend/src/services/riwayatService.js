// ============================================
// RIWAYAT SERVICE
// ============================================
import api from './api';

export const riwayatService = {
  getAll: (params) => api.get('/riwayat', { params }),
  exportPdf: (params) => api.get('/export/riwayat/pdf', { params, responseType: 'blob', timeout: 60000 }),
  exportExcel: (params) => api.get('/export/riwayat/excel', { params, responseType: 'blob', timeout: 60000 }),
};

export default riwayatService;