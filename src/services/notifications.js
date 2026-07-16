import api from './api.js';

export const getNotifications = () => api.get('/api/notifications/');
export const getUnreadCount   = () => api.get('/api/notifications/unread-count/');
export const markRead         = (id) => api.patch(`/api/notifications/${id}/read/`);
export const deleteNotification = (id) => api.delete(`/api/notifications/${id}/`);