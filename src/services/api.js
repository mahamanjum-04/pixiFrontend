import axios from 'axios';

const getBaseURL = () => {
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
    const protocol = window.location.protocol;
    const host = window.location.host;
    if (host.includes('localhost') || host.includes('127.0.0.1')) return 'http://localhost:8000';
    return `${protocol}//${host}`;
};

const api = axios.create({
    baseURL: getBaseURL(),
});

api.interceptors.request.use(config => {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    config.headers['ngrok-skip-browser-warning'] = 'true';
    if (config.data instanceof FormData) delete config.headers['Content-Type'];
    return config;
});

api.interceptors.response.use(
    res => res,
    async err => {
        const original = err.config;
        if (err.response?.status === 401 && !original._retry) {
            original._retry = true;
            try {
                const refresh = localStorage.getItem('refresh_token');
                if (!refresh) throw new Error('No refresh token');
                const { data } = await axios.post(
                    `${getBaseURL()}/api/auth/refresh/`,
                    { refresh }
                );
                localStorage.setItem('access_token', data.access);
                original.headers.Authorization = `Bearer ${data.access}`;
                return api(original);
            } catch {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/login';
            }
        }
        return Promise.reject(err);
    }
);

export default api;