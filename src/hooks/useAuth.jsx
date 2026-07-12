// src/hooks/useAuth.jsx

import { createContext, useState, useEffect, useCallback, useContext } from 'react';
import api from '../services/api.js';

export const AuthContext = createContext(null);

// ✅ Add this hook here
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [accessToken, setAccessToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load user if token exists on page load
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token) {
            setAccessToken(token);
            fetchUser(token);
        } else {
            setLoading(false);
        }
    }, []);

    const fetchUser = async (token) => {
        try {
            const response = await api.get('/api/auth/me/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUser(response.data);
        } catch (error) {
            console.error('Failed to fetch user:', error);
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            setAccessToken(null);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    // LOGIN - Save token to localStorage
    const login = async (email, password) => {
        try {
            const response = await api.post('/api/auth/login/', { email, password });

            // Save tokens
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
            localStorage.setItem('user', JSON.stringify(user));

            setAccessToken(response.data.access);
            setUser(response.data.user);

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.detail || 'Login failed'
            };
        }
    };

    // LOGOUT - Remove tokens
    const logout = useCallback(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setAccessToken(null);
        setUser(null);
    }, []);


    const setAuth = useCallback((tokens, userData) => {
    if (tokens) {
        localStorage.setItem('access_token', tokens.access);
        localStorage.setItem('refresh_token', tokens.refresh);

        setAccessToken(tokens.access);
    }
    if (userData) {
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    }
}, []);


    // Context value
    const value = {
        user,
        accessToken,
        loading,
        login,
        logout,
        setAuth,
        isAuthenticated: !!accessToken && !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}