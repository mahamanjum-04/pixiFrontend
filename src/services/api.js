import axios from 'axios';

const getBaseURL = () => {
    if (import.meta.env.VITE_API_URL) {
        console.log('✅ Using VITE_API_URL:', import.meta.env.VITE_API_URL);
        return import.meta.env.VITE_API_URL;
    }
    console.warn('⚠️ VITE_API_URL not set, using fallback');
    const protocol = window.location.protocol;
    const host = window.location.host;
    if (host.includes('localhost') || host.includes('127.0.0.1')) return 'http://localhost:8000';
    return `${protocol}//${host}`;
};

const getSearchBaseURL = () => {
    return import.meta.env.VITE_SEARCH_API_URL || 'https://pixi-tem-pixi-ai-service.hf.space';
};

// Default API client (for everything except search)
const api = axios.create({
    baseURL: getBaseURL(),
    timeout: 30000,
});

// Separate client for search endpoints
const searchApi = axios.create({
    baseURL: getSearchBaseURL(),
    timeout: 30000,
});

api.interceptors.request.use(config => {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// ── Proactive token refresh ─────────────────────────────────────────────
// Decode the JWT to read its expiry, then refresh it shortly before it
// expires so the user never hits a 401 in normal usage.

let proactiveRefreshTimer = null;

function decodeTokenExp(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp; // seconds since epoch
    } catch {
        return null;
    }
}

function scheduleProactiveRefresh() {
    clearTimeout(proactiveRefreshTimer);

    const access = localStorage.getItem('access_token');
    if (!access) return;

    const exp = decodeTokenExp(access);
    if (!exp) return;

    const now = Math.floor(Date.now() / 1000);
    const secondsUntilExpiry = exp - now;

    // Refresh 60 s before expiry, but at least in 10 s from now
    const delay = Math.max((secondsUntilExpiry - 60) * 1000, 10_000);

    proactiveRefreshTimer = setTimeout(async () => {
        const refresh = localStorage.getItem('refresh_token');
        if (!refresh) return;
        try {
            const { data } = await axios.post(
                `${getBaseURL()}/api/auth/refresh/`,
                { refresh },
            );
            localStorage.setItem('access_token', data.access);
            scheduleProactiveRefresh(); // schedule the next one
        } catch {
            // Refresh failed — the reactive interceptor will handle 401s
        }
    }, delay);
}

// Kick off on module load (only if tokens exist)
if (localStorage.getItem('access_token')) {
    scheduleProactiveRefresh();
}

// ── Reactive 401 interceptor (fallback) ────────────────────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error);
        } else {
            resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    res => res,
    async err => {
        const original = err.config;
        if (err.response?.status === 401 && !original._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    original.headers.Authorization = `Bearer ${token}`;
                    return api(original);
                });
            }

            original._retry = true;
            isRefreshing = true;

            try {
                const refresh = localStorage.getItem('refresh_token');
                if (!refresh) throw new Error('No refresh token');
                const { data } = await axios.post(
                    `${getBaseURL()}/api/auth/refresh/`,
                    { refresh },
                );
                localStorage.setItem('access_token', data.access);
                scheduleProactiveRefresh(); // reset proactive timer
                processQueue(null, data.access);
                original.headers.Authorization = `Bearer ${data.access}`;
                return api(original);
            } catch (refreshError) {
                processQueue(refreshError, null);
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(err);
    }
);

export { scheduleProactiveRefresh };
export { api, searchApi };