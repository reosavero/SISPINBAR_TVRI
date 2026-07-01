// ============================================
// AUTH SERVICE
// ============================================
import api from './api';

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials), // { username, password }
  getProfile: () => api.get('/auth/profile'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
  changePassword: (data) => api.put('/auth/change-password', data),
};

export default authService;