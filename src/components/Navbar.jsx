import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuthContext.jsx';
import NotificationBadge from './NotificationBadge.jsx';
import useDarkMode from '../hooks/useDarkMode.js';

export default function Navbar() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [dark, setDark] = useDarkMode();
    const [inboxOpen, setInboxOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const isActive = (path) => location.pathname === path;

    // Inbox panel would need requests data — we'll keep it simple and link to /inbox on mobile
    // On desktop, clicking messages navigates to /inbox

    return (
        <>
            {/* ===== DESKTOP NAVBAR ===== */}
            <nav className="hidden md:flex sticky top-0 z-50 bg-white dark:bg-[#141414] border-b border-gray-100 dark:border-gray-800 px-6 py-3 items-center justify-between">
                {/* Left: Logo */}
                <Link to="/browse" className="flex-shrink-0">
                    <img
                        src={dark ? "/assets/dark-logo.png" : "/assets/light-logo.png"}
                        alt="PIXI"
                        className="h-8"
                    />
                </Link>

                {/* Center: Search bar */}
                <Link
                    to="/search"
                    className="flex-1 max-w-md mx-8"
                >
                    <div className="w-full px-4 py-2 rounded-full bg-gray-100 dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-700 text-sm text-gray-400 dark:text-gray-500 hover:border-gray-300 dark:hover:border-gray-600 transition cursor-pointer">
                        Search artworks...
                    </div>
                </Link>

                {/* Right: Icons */}
                <div className="flex items-center gap-3">
                    {/* Messages */}
                    <Link
                        to="/inbox"
                        className="w-9 h-9 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#0a0a0a] transition"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                        </svg>
                    </Link>

                    {/* Notifications */}
                    <NotificationBadge />

                    {/* Profile avatar */}
                    <Link to="/profile">
                        <div className="w-9 h-9 rounded-full bg-[#9440dd] flex items-center justify-center text-xs font-semibold text-white">
                            {user?.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                    </Link>

                    {/* Dark mode toggle */}
                    <button
                        onClick={() => setDark(d => !d)}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#0a0a0a] transition text-lg"
                        aria-label="Toggle dark mode"
                    >
                        {dark ? '☀' : '🌙'}
                    </button>

                    {/* Sign out */}
                    <button
                        onClick={() => { logout(); navigate('/login'); }}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition text-xs ml-1"
                    >
                        Sign out
                    </button>
                </div>
            </nav>

            {/* ===== MOBILE TOP BAR ===== */}
            <div className="md:hidden sticky top-0 z-50 bg-white dark:bg-[#141414] border-b border-gray-100 dark:border-gray-800 px-4 py-2.5 flex items-center justify-between">
                {/* Messages icon top right */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setDark(d => !d)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#0a0a0a] transition text-base"
                        aria-label="Toggle dark mode"
                    >
                        {dark ? '☀' : '🌙'}
                    </button>
                </div>

                {/* Logo centered */}
                <Link to="/browse" className="absolute left-1/2 -translate-x-1/2">
                    <img
                        src={dark ? "/assets/dark-logo.png" : "/assets/light-logo.png"}
                        alt="PIXI"
                        className="h-7"
                    />
                </Link>

                {/* Messages icon */}
                <Link
                    to="/inbox"
                    className="w-8 h-8 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#0a0a0a] transition"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                </Link>
            </div>

            {/* ===== MOBILE BOTTOM TAB BAR ===== */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#141414] border-t border-gray-100 dark:border-gray-800 px-2 py-1.5 flex items-center justify-around">
                <Link
                    to="/browse"
                    className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition ${isActive('/browse') ? 'text-[#9440dd]' : 'text-gray-400'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive('/browse') ? 2.5 : 1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                    </svg>
                    <span className="text-[10px] font-medium">Home</span>
                </Link>

                <Link
                    to="/search"
                    className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition ${isActive('/search') ? 'text-[#9440dd]' : 'text-gray-400'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive('/search') ? 2.5 : 1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                    <span className="text-[10px] font-medium">Search</span>
                </Link>

                {user?.is_creator && (
                    <Link
                        to="/upload"
                        className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition ${isActive('/upload') ? 'text-[#9440dd]' : 'text-gray-400'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive('/upload') ? 2.5 : 1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        <span className="text-[10px] font-medium">Upload</span>
                    </Link>
                )}

                <Link
                    to="/profile"
                    className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition ${isActive('/profile') ? 'text-[#9440dd]' : 'text-gray-400'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive('/profile') ? 2.5 : 1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                    <span className="text-[10px] font-medium">Profile</span>
                </Link>
            </div>
        </>
    );
}