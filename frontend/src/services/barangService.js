

import api from './api';

export const barangService = {
  getAll: (params) => api.get('/barang', { params }),
  getById: (id) => api.get(`/barang/${id}`),
  create: (data) => api.post('/barang', data),
  update: (id, data) => api.put(`/barang/${id}`, data),
  delete: (id) => api.delete(`/barang/${id}`),
  getAvailable: () => api.get('/barang/available'),
};

export default barangService;