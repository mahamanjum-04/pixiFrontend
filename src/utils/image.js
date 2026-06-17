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
