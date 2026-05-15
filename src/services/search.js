import api from './api';

export const searchByText = (query) =>
    api.post('/api/ai/search/text/', { query });

export const searchByImage = (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    return api.post('/api/ai/search/image/', formData);
};