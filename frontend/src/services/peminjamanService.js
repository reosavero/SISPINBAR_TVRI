

import api from './api';

export const peminjamanService = {
  getAll: (params) => api.get('/peminjaman', { params }),
  getById: (id) => api.get(`/peminjaman/${id}`),
  create: (data) => api.post('/peminjaman', data),
  update: (id, data) => api.put(`/peminjaman/${id}`, data),
  approve: (id) => api.put(`/peminjaman/${id}/approve`),
  reject: (id, data) => api.put(`/peminjaman/${id}/reject`, data),
  delete: (id) => api.delete(`/peminjaman/${id}`),
};

export default peminjamanService;