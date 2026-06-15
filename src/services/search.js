import api from './api.js';

export const searchByText = (query) =>
    api.post('/api/artworks/search/text/', { query });

export const searchByImage = (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    return api.post('/api/artworks/search/image/', formData);
};