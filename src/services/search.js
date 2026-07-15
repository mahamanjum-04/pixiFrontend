import {searchApi} from './api.js';

export const searchByText = (query) =>
    searchApi.post('/api/artworks/search/text/', { query });

export const searchByImage = (imageFile, threshold = 0.6) => {
    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('threshold', threshold);
    return searchApi.post('/api/artworks/search/image/', formData);
};