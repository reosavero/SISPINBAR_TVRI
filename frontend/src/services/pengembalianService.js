// ============================================
// PENGEMBALIAN SERVICE
// ============================================
import api from './api';

export const pengembalianService = {
  getAll: (params) => api.get('/pengembalian', { params }),
  getById: (id) => api.get(`/pengembalian/${id}`),
  create: (data) => api.post('/pengembalian', data),
};

export default pengembalianService;