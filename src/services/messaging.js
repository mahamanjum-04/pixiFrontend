// src/services/messaging.js
import api from './api';

export const getRequests = () => api.get('/api/message-requests/');
export const sendRequest = (data) => api.post('/api/message-requests/', data);
export const acceptRequest = (id) => api.patch(`/api/message-requests/${id}/accept/`);
export const rejectRequest = (id) => api.patch(`/api/message-requests/${id}/reject/`);
export const getChatHistory = (id) => api.get(`/api/message-requests/chat/${id}/`);
export const sendMessage = (roomId, content) => api.post(`/api/message-requests/chat/${roomId}/`, { content });
export const getRequestDetail = (id) => api.get(`/api/message-requests/${id}/`);