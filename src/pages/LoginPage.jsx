// src/pages/LoginPage.jsx

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { googleLogin as googleLoginRequest } from '../services/auth.js';  // only for Google
import { useAuth } from '../hooks/useAuth.jsx';
import useDarkMode from '../hooks/useDarkMode.js';

export default function LoginPage() {
    const { login, setAuth } = useAuth();   // ✅ get setAuth for Google
    const navigate = useNavigate();
    const [dark] = useDarkMode();

    // ✅ State uses 'email' consistently
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    const handleChange = e =>
        setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    // ── Normal login ────────────────────────────────────────────────
    const handleSubmit = async () => {
    setError('');
    if (!form.email || !form.password) {
        setError('Please fill in all fields.');
        return;
    }
    setLoading(true);
    try {
        const result = await login(form.email, form.password);
        console.log('Login result:', result);   // ✅ Add this to debug

        if (result.success) {
            const user = result.user;
            console.log('User from result:', user);

            if (user.is_superuser || user.is_staff) {
                navigate('/admin');
            } else if (!user.has_set_interests) {
                navigate('/interests');
            } else if (user.is_creator) {
                navigate('/portfolio');
            } else {
                navigate('/browse');
            }
        } else {
            setError(result.error || 'Invalid email or password.');
        }
    } catch (err) {
        console.error('Unexpected error:', err);   // ✅ Debug
        setError('Something went wrong. Please try again.');
    } finally {
        setLoading(false);
    }
};

    // ── Google login ──────────────────────────────────────────────────
    useEffect(() => {
        const handleCredentialResponse = async (response) => {
            setError('');
            setGoogleLoading(true);
            try {
                const res = await googleLoginRequest({ access_token: response.credential });
                const { access, refresh, user } = res.data;
                // ✅ Use setAuth (new method) to store tokens and user
                setAuth({ access, refresh }, user);
                if (user.is_superuser || user.is_staff) navigate('/admin');
                else if (!user.has_set_interests) navigate('/interests');
                else if (user.is_creator) navigate('/portfolio');
                else navigate('/browse');
            } catch (err) {
                setError(err.response?.data?.error || 'Google login failed. Please try again.');
            } finally {
                setGoogleLoading(false);
            }
        };

        const initGoogle = () => {
            if (window.google && import.meta.env.VITE_GOOGLE_CLIENT_ID) {
                window.google.accounts.id.initialize({
                    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
                    callback: handleCredentialResponse,
                });
                window.google.accounts.id.renderButton(
                    document.getElementById('google-signin-btn'),
                    {
                        theme: dark ? 'filled_black' : 'outline',
                        size: 'large',
                        width: '100%',
                        shape: 'rectangular',
                        text: 'continue_with',
                    }
                );
            }
        };

        if (window.google) {
            initGoogle();
        } else {
            const interval = setInterval(() => {
                if (window.google) {
                    clearInterval(interval);
                    initGoogle();
                }
            }, 100);
            return () => clearInterval(interval);
        }
    }, [dark, setAuth, navigate]);

    // ── UI ──
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex items-center justify-center px-4">
            <div className="w-full max-w-sm bg-white dark:bg-[#141414] rounded-2xl border border-gray-100 dark:border-gray-800 p-8">

                <div className="flex justify-center mb-4">
                    <img
                        src={dark ? "/assets/dark-logo.png" : "/assets/light-logo.png"}
                        alt="PIXI"
                        className="h-8"
                    />
                </div>

                <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-1 text-center">Welcome back</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center">Sign in to your PIXI account</p>

                {error && (
                    <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#9440dd] focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#9440dd] focus:border-transparent"
                            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                        />
                    </div>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="mt-6 w-full bg-[#9440dd] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#7d36c0] transition disabled:opacity-50"
                >
                    {loading ? 'Signing in...' : 'Sign in'}
                </button>

                <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-[#9440dd] font-medium hover:underline">
                        Create one
                    </Link>
                </p>

                <div className="flex items-center gap-3 my-6">
                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                    <span className="text-xs text-gray-400 dark:text-gray-500">Or continue with</span>
                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                </div>

                {googleLoading && (
                    <p className="text-center text-xs text-gray-400 dark:text-gray-500 mb-2">Signing in with Google…</p>
                )}
                {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
                    <div id="google-signin-btn" className="w-full flex justify-center" />
                ) : (
                    <p className="text-center text-xs text-amber-500 dark:text-amber-400">
                        Google login is not configured.
                    </p>
                )}

            </div>
        </div>
    );
}