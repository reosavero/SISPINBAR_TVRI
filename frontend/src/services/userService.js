

import api from './api';

const userService = {
  
  getAll: async (params = {}) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  
  getAdmins: async (params = {}) => {
    const response = await api.get('/users/admins', { params });
    return response.data;
  },

  
  getStats: async () => {
    const response = await api.get('/users/stats');
    return response.data;
  },

  
  getById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  
  createAdmin: async (data) => {
    const response = await api.post('/users/admin', data);
    return response.data;
  },

  
  update: async (id, data) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  
  delete: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  
  toggleActive: async (id) => {
    const response = await api.put(`/users/${id}/toggle-active`);
    return response.data;
  },

  
  getByJabatanOrDivisi: async (params = {}) => {
    const response = await api.get('/users/by-jabatan-divisi', { params });
    return response.data;
  },

  
  resetPassword: async (id, newPassword) => {
    const response = await api.put(`/users/${id}/reset-password`, { newPassword });
    return response.data;
  },

  
  resetLock: async (id) => {
    const response = await api.put(`/users/${id}/reset-lock`);
    return response.data;
  },
};

export default userService;