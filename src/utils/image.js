const getBaseURL = () => {
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
    const protocol = window.location.protocol;
    const host = window.location.host;
    if (host.includes('localhost') || host.includes('127.0.0.1')) return 'http://localhost:8000';
    return `${protocol}//${host}`;
};

export const resolveImage = (url) => {
    if (!url) return null;
    if (url.startsWith('data:') || url.startsWith('blob:')) return url;

    const baseURL = getBaseURL();

    if (url.includes('127.0.0.1') || url.includes('localhost')) {
        const match = url.match(/\/media\/.*$/);
        if (match) return `${baseURL}${match[0]}`;
    }

    if (url.startsWith('http')) return url;
    return `${baseURL}${url.startsWith('/') ? '' : '/'}${url}`;
};