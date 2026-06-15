import api from './api';

export const getArtworks   = ()           => api.get('/api/artworks/');
export const getArtwork    = (id)         => api.get(`/api/artworks/${id}/`);
//export const uploadArtwork = (data)       => api.post('/api/artworks/', data);
export const updateArtwork = (id, data)   => api.patch(`/api/artworks/${id}/edit/`, data);
export const deleteArtwork = (id)         => api.delete(`/api/artworks/${id}/edit/`);
export const updateStatus  = (id, status) => api.patch(`/api/artworks/${id}/status/`, { status });
// services/artworks.js
export const uploadArtwork = async (data) => {
    // Debug: log what's being sent
    for (let pair of data.entries()) {
        console.log(pair[0], pair[1]);
    }
    return api.post('/api/artworks/', data);
};