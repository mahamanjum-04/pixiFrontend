import api from './api';

export const getReviews  = (artworkId) => api.get(`/api/reviews/${artworkId}/`);
export const postReview  = (artworkId, data) => api.post(`/api/reviews/${artworkId}/`, data);