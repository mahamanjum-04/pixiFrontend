import api from './api.js';

export const getUsers       = ()         => api.get('/api/admin/users/');
export const banUser        = (id)       => api.patch(`/api/admin/users/${id}/ban/`);
export const unbanUser      = (id)       => api.patch(`/api/admin/users/${id}/unban/`);
export const removeContent  = (id)       => api.delete(`/api/admin/content/${id}/`);
export const getReports     = ()         => api.get('/api/admin/reports/');
export const resolveReport  = (id)       => api.patch(`/api/admin/reports/${id}/resolve/`);
export const submitReport   = (data)     => api.post('/api/admin/submit-report/', data);
export const getCreatorAnalytics = ()    => api.get('/api/reports/creator/');
export const getAdminAnalytics   = ()    => api.get('/api/reports/admin/');