import api from './api';

export const register = (data) => api.post('/api/auth/register/', data);
export const login    = (data) => api.post('/api/auth/login/', data);
export const getMe    = ()     => api.get('/api/auth/me/');
export const updateMe = (data) => api.patch('/api/auth/me/', data);
export const refreshToken = (refresh) => api.post('/api/auth/refresh/', { refresh });