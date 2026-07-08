// ============================================
// SETTINGS SERVICE - Sistem Peminjaman Barang TVRI
// Super Admin: System Settings
// ============================================

import api from './api';

const settingsService = {
  // Get all settings
  getAll: async () => {
    const response = await api.get('/settings');
    return response.data;
  },

  // Get app info
  getAppInfo: async () => {
    const response = await api.get('/settings/app-info');
    return response.data;
  },

  // Update a single setting
  update: async (key, value) => {
    const response = await api.put('/settings', { key, value });
    return response.data;
  },

  // Update multiple settings
  updateMultiple: async (settings) => {
    const response = await api.put('/settings/batch', { settings });
    return response.data;
  },
};

export default settingsService;