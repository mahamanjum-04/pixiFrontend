import {searchApi} from './api.js';

export const searchByText = (query) =>
    searchApi.post('/api/artworks/search/text/', { query });

export const searchByImage = (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    return searchApi.post('/api/artworks/search/image/', formData);
};