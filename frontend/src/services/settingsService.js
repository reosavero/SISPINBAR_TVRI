

import api from './api';

const settingsService = {
  
  getAll: async () => {
    const response = await api.get('/settings');
    return response.data;
  },

  
  getAppInfo: async () => {
    const response = await api.get('/settings/app-info');
    return response.data;
  },

  
  update: async (key, value) => {
    const response = await api.put('/settings', { key, value });
    return response.data;
  },

  
  updateMultiple: async (settings) => {
    const response = await api.put('/settings/batch', { settings });
    return response.data;
  },
};

export default settingsService;