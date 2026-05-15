import api from './api';

export const createIntent     = (artworkId) => api.post('/api/purchases/create-intent/', { artwork: artworkId });
export const confirmPurchase  = (data)      => api.post('/api/purchases/confirm/', data);
export const getPurchases     = ()          => api.get('/api/purchases/');