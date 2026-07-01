// ============================================
// RIWAYAT SERVICE
// ============================================
import api from './api';

export const riwayatService = {
  getAll: (params) => api.get('/riwayat', { params }),
  exportPdf: (params) => api.get('/riwayat/export/pdf', { params, responseType: 'blob' }),
  exportExcel: (params) => api.get('/riwayat/export/excel', { params, responseType: 'blob' }),
};

export default riwayatService;