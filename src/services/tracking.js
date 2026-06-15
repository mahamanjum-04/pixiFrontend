import api from './api';

export const trackClick = (artworkId) => {
    api.post('/api/tracking/click/', { artwork_id: artworkId }).catch(() => {});
};