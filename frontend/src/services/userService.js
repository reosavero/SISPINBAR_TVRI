// ============================================
// USER SERVICE - Sistem Peminjaman Barang TVRI
// Super Admin: Manajemen User (Admin)
// ============================================

import api from './api';

const userService = {
  // Get all users
  getAll: async (params = {}) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  // Get admins only
  getAdmins: async (params = {}) => {
    const response = await api.get('/users/admins', { params });
    return response.data;
  },

  // Get user stats
  getStats: async () => {
    const response = await api.get('/users/stats');
    return response.data;
  },

  // Get user by ID
  getById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Create admin
  createAdmin: async (data) => {
    const response = await api.post('/users/admin', data);
    return response.data;
  },

  // Update user
  update: async (id, data) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  // Delete user (soft delete)
  delete: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  // Toggle active/inactive
  toggleActive: async (id) => {
    const response = await api.put(`/users/${id}/toggle-active`);
    return response.data;
  },

  // Reset password
  resetPassword: async (id, newPassword) => {
    const response = await api.put(`/users/${id}/reset-password`, { newPassword });
    return response.data;
  },
};

export default userService;