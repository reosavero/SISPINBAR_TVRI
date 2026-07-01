// ============================================
// DASHBOARD SERVICE
// ============================================
import api from './api';

export const dashboardService = {
  getStats: () =>> api.get('/dashboard/stats'),
  getMonthlyLoans: (year) => api.get(`/dashboard/monthly-loans?year=${year || new Date().getFullYear()}`),
  getBarangStatus: () => api.get('/dashboard/barang-status'),
  getRecentActivity: (page = 1, limit = 5) => api.get(`/dashboard/recent-activity?page=${page}&limit=${limit}`),
  getAvailableYears: () => api.get('/dashboard/available-years'),
  getTodayLoans: () => api.get('/dashboard/today-loans'),
  getTodayReturns: () => api.get('/dashboard/today-returns'),
};

export default dashboardService;