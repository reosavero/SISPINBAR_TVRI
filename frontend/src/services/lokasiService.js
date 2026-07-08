// ============================================
// LOKASI SERVICE (Frontend API) - Sistem Peminjaman Barang TVRI
// ============================================

import api from './api';

const lokasiService = {
  // Get all locations with search/filter/pagination
  getAll: async (params = {}) => {
    const res = await api.get('/lokasi', { params });
    return res.data;
  },

  // Get single location by ID
  getById: async (id) => {
    const res = await api.get(`/lokasi/${id}`);
    return res.data;
  },

  // Get active locations (for dropdowns)
  getActive: async () => {
    const res = await api.get('/lokasi/active');
    return res.data;
  },

  // Get barang by lokasi
  getBarangByLokasi: async (lokasiId, params = {}) => {
    const res = await api.get(`/lokasi/${lokasiId}/barang`, { params });
    return res.data;
  },

  // Create lokasi
  create: async (data) => {
    const res = await api.post('/lokasi', data);
    return res.data;
  },

  // Update lokasi
  update: async (id, data) => {
    const res = await api.put(`/lokasi/${id}`, data);
    return res.data;
  },

  // Delete lokasi (soft delete)
  delete: async (id) => {
    const res = await api.delete(`/lokasi/${id}`);
    return res.data;
  },

  // Restore lokasi
  restore: async (id) => {
    const res = await api.put(`/lokasi/${id}/restore`);
    return res.data;
  },

  // Get location stats (for dashboard)
  getStats: async () => {
    const res = await api.get('/lokasi/stats');
    return res.data;
  },
};

export default lokasiService;