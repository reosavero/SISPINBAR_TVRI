

import api from './api';

const divisiService = {
  getAll: async (params = {}) => {
    const res = await api.get('/divisi', { params });
    return res.data;
  },
  getAllActive: async () => {
    const res = await api.get('/divisi/active');
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/divisi/${id}`);
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/divisi', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/divisi/${id}`, data);
    return res.data;
  },
  toggleActive: async (id) => {
    const res = await api.patch(`/divisi/${id}/toggle-active`);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/divisi/${id}`);
    return res.data;
  },
};

export default divisiService;