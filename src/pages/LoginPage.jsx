// src/pages/LoginPage.jsx

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { googleLogin as googleLoginRequest } from '../services/auth.js';
import { useAuth } from '../hooks/useAuth.jsx';
import useDarkMode from '../hooks/useDarkMode.js';

export default function LoginPage() {
    const { login, setAuth, logout } = useAuth();
    const navigate = useNavigate();
    const [dark] = useDarkMode();

    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [showBanned, setShowBanned] = useState(false);

    const handleChange = e =>
        setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const handleSubmit = async () => {
        setError('');
        if (!form.email || !form.password) {
            setError('Please fill in all fields.');
            return;
        }
        setLoading(true);
        try {
            const result = await login(form.email, form.password);

            if (result.success) {
                const user = result.user;

                if (user.is_banned) {
                    setShowBanned(true);
                    return;
                }

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
            console.error('Unexpected error:', err);
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleBannedOk = () => {
        setShowBanned(false);
        logout();
        navigate('/login');
    };

    useEffect(() => {
        const handleCredentialResponse = async (response) => {
            setError('');
            setGoogleLoading(true);
            try {
                const res = await googleLoginRequest({ access_token: response.credential });
                const { access, refresh, user } = res.data;
                setAuth({ access, refresh }, user);

                if (user.is_banned) {
                    setShowBanned(true);
                    return;
                }

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

    return (
        <div className="min-h-screen flex bg-white dark:bg-[#0a0a0a]">

            {/* ===== LEFT: Brand panel ===== */}
            <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-gradient-to-br from-[#9440dd] to-[#5b2490] flex-col justify-between p-12">

                {/* Decorative corner-frame brackets — evokes a gallery viewfinder */}
                <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 500 800" fill="none" preserveAspectRatio="none">
                    <path d="M40 60 L40 40 L60 40" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    <path d="M440 40 L460 40 L460 60" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    <path d="M40 740 L40 760 L60 760" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    <path d="M460 740 L460 760 L440 760" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="90" cy="150" r="3" fill="white" />
                    <circle cx="130" cy="200" r="2" fill="white" />
                    <circle cx="420" cy="620" r="3" fill="white" />
                    <circle cx="380" cy="670" r="2" fill="white" />
                    <circle cx="60" cy="600" r="2" fill="white" />
                </svg>

                {/* Large soft ring — a "canvas" motif */}
                <div className="absolute -right-24 -bottom-24 w-96 h-96 rounded-full border border-white/20" />
                <div className="absolute -right-16 -bottom-16 w-72 h-72 rounded-full border border-white/10" />

                {/* Logo */}
                <div className="relative z-10">
                    <img src="/assets/dark-logo.png" alt="PIXI" className="h-9 brightness-0 invert" />
                </div>

                {/* Tagline */}
                <div className="relative z-10 max-w-sm">
                    <h1 className="text-4xl font-semibold text-white leading-tight mb-4">
                        Where art finds its audience
                    </h1>
                    <p className="text-white/70 text-sm leading-relaxed">
                        Discover original work from independent creators, or open your own portfolio and start selling — PIXI is the gallery wall for the internet.
                    </p>
                </div>

                {/* Spacer footer note */}
                <p className="relative z-10 text-white/40 text-xs">
                    © {new Date().getFullYear()} PIXI
                </p>
            </div>

            {/* ===== RIGHT: Form panel ===== */}
            <div className="flex-1 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-sm">

                    {/* Logo — mobile/tablet only, since brand panel is hidden below lg */}
                    <div className="flex lg:hidden justify-center mb-6">
                        <img
                            src={dark ? "/assets/dark-logo.png" : "/assets/light-logo.png"}
                            alt="PIXI"
                            className="h-8"
                        />
                    </div>

                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-1">Welcome back</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Sign in to your PIXI account</p>

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
                                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-[#141414] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#9440dd] focus:border-transparent"
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
                                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-[#141414] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#9440dd] focus:border-transparent"
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

            {/* Banned user modal */}
            {showBanned && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
                    <div className="bg-white dark:bg-[#141414] rounded-2xl p-6 w-full max-w-sm text-center">
                        <div className="text-4xl mb-3">🚫</div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            Account suspended
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            Your account has been banned for violating our community guidelines. If you believe this is a mistake, please contact support.
                        </p>
                        <button
                            onClick={handleBannedOk}
                            className="w-full bg-[#9440dd] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#7d36c0] transition"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}