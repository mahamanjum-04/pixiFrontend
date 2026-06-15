import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuthContext.jsx';
import NotificationBadge from './NotificationBadge.jsx';

export default function Navbar() {
    const { user, logout } = useAuth();
    const location = useLocation();

    const active = (path) =>
        location.pathname === path ? 'text-black font-medium' : 'text-gray-500 hover:text-black';

    return (
        <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">

            <Link to="/browse" className="text-xl font-bold tracking-tight text-black">PIXI</Link>

            <div className="flex items-center gap-6 text-sm">
                <Link to="/browse" className={active('/browse')}>Browse</Link>
                <Link to="/search" className={active('/search')}>Search</Link>
                {user?.is_creator && (
                    <>
                        <Link to="/portfolio" className={active('/portfolio')}>Portfolio</Link>
                        <Link to="/upload"    className={active('/upload')}>Upload</Link>
                        <Link to="/analytics" className={active('/analytics')}>Analytics</Link>
                    </>
                )}
            </div>

            <div className="flex items-center gap-4 text-sm">
                <Link to="/saved"  className={active('/saved')}>Saved</Link>
                <Link to="/inbox"  className={active('/inbox')}>Inbox</Link>
                {user?.is_buyer && (
                    <Link to="/purchased" className={active('/purchased')}>Purchases</Link>
                )}
                <NotificationBadge />
                <Link to="/profile">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                        {user?.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                </Link>
                <button onClick={logout} className="text-gray-400 hover:text-black transition text-xs">
                    Sign out
                </button>
            </div>

        </nav>
    );
}