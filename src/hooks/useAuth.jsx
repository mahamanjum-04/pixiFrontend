import { useState, useEffect, createContext, useCallback } from 'react';
import { getMe } from '../services/auth.js';
import { scheduleProactiveRefresh } from '../services/api.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser]       = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const fetchUser = async () => {
            const token = localStorage.getItem('access_token');
            if (!token) {
                if (!cancelled) setLoading(false);
                return;
            }
            try {
                const res = await getMe();
                if (!cancelled) setUser(res.data);
            } catch (err) {
                // Only force-logout on 401 (token truly invalid after
                // the interceptor had a chance to refresh).  Transient
                // network errors should NOT wipe the session.
                const isUnauthorized = err?.response?.status === 401;
                if (isUnauthorized && !cancelled) {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    window.location.href = '/login';
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchUser();
        return () => { cancelled = true; };
    }, []);

    const login = useCallback((tokens, userData) => {
        localStorage.setItem('access_token', tokens.access);
        localStorage.setItem('refresh_token', tokens.refresh);
        setUser(userData);
        // Start proactive refresh so the token is renewed before expiry
        scheduleProactiveRefresh();
        // redirect to interests page on first login
        if (!userData.has_set_interests) {
            window.location.href = '/interests';
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
        window.location.href = '/login';
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}