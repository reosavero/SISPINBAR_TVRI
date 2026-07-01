// ============================================
// KATEGORI SERVICE
// ============================================
import api from './api';

export const kategoriService = {
  getAll: (params) => api.get('/kategori', { params }),
  getById: (id) => api.get(`/kategori/${id}`),
  create: (data) => api.post('/kategori', data),
  update: (id, data) => api.put(`/kategori/${id}`, data),
  delete: (id) => api.delete(`/kategori/${id}`),
};

export default kategoriService;