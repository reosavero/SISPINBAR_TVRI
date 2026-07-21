

import api from './api';

export const pegawaiService = {
  getAll: (params) => api.get('/pegawai', { params }),
  getById: (id) => api.get(`/pegawai/${id}`),
  create: (data) => api.post('/pegawai', data),
  update: (id, data) => api.put(`/pegawai/${id}`, data),
  delete: (id) => api.delete(`/pegawai/${id}`),
  resetLock: (id) => api.put(`/pegawai/${id}/reset-lock`),
};

export default pegawaiService;