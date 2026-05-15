import api from './api';

export const getNotifications = () => api.get('/api/notifications/');
export const getUnreadCount   = () => api.get('/api/notifications/unread-count/');
export const markRead         = (id) => api.patch(`/api/notifications/${id}/read/`);