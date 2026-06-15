import api from './api.js';

export const getInterests  = ()           => api.get('/api/auth/interests/');
export const saveInterests = (interests)  => api.post('/api/auth/interests/', { interests });