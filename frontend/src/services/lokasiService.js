

import api from './api';

const lokasiService = {
  
  getAll: async (params = {}) => {
    const res = await api.get('/lokasi', { params });
    return res.data;
  },

  
  getById: async (id) => {
    const res = await api.get(`/lokasi/${id}`);
    return res.data;
  },

  
  getActive: async () => {
    const res = await api.get('/lokasi/active');
    return res.data;
  },

  
  getBarangByLokasi: async (lokasiId, params = {}) => {
    const res = await api.get(`/lokasi/${lokasiId}/barang`, { params });
    return res.data;
  },

  
  create: async (data) => {
    const res = await api.post('/lokasi', data);
    return res.data;
  },

  
  update: async (id, data) => {
    const res = await api.put(`/lokasi/${id}`, data);
    return res.data;
  },

  
  delete: async (id) => {
    const res = await api.delete(`/lokasi/${id}`);
    return res.data;
  },

  
  restore: async (id) => {
    const res = await api.put(`/lokasi/${id}/restore`);
    return res.data;
  },

  
  getStats: async () => {
    const res = await api.get('/lokasi/stats');
    return res.data;
  },
};

export default lokasiService;