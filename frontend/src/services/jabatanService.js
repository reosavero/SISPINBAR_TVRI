// ============================================
// JABATAN SERVICE - Sistem Peminjaman Barang TVRI
// ============================================

import api from './api';

const jabatanService = {
  getAll: async (params = {}) => {
    const res = await api.get('/jabatan', { params });
    return res.data;
  },
  getAllActive: async () => {
    const res = await api.get('/jabatan/active');
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/jabatan/${id}`);
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/jabatan', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/jabatan/${id}`, data);
    return res.data;
  },
  toggleActive: async (id) => {
    const res = await api.patch(`/jabatan/${id}/toggle-active`);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/jabatan/${id}`);
    return res.data;
  },
};

export default jabatanService;