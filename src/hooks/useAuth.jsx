import { useState, useEffect, createContext, useCallback } from 'react';
import { getMe } from '../services/auth';

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
            } catch {
                if (!cancelled) {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
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