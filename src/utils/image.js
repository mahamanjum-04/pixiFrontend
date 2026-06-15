const getBaseURL = () => {
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
    const protocol = window.location.protocol;
    const host = window.location.host;
    if (host.includes('localhost') || host.includes('127.0.0.1')) return 'http://localhost:8000';
    return `${protocol}//${host}`;
};

// utils/image.js
export const resolveImage = (url) => {
    if (!url) return null;
    if (url.startsWith('data:') || url.startsWith('blob:')) return url;
    if (url.startsWith('http')) return url;

    // Get base URL from environment or window location
    const baseURL = import.meta.env.VITE_API_URL ||
        `${window.location.protocol}//${window.location.host}`;

    // If URL is already a full media path
    if (url.startsWith('/media/')) {
        return `${baseURL}${url}`;
    }

    // For relative paths from the backend
    return `${baseURL}${url.startsWith('/') ? '' : '/'}${url}`;
};
