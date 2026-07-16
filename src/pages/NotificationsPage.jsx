import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import { getNotifications, markRead, deleteNotification } from '../services/notifications.js';
const TYPE_META = {
    purchase:          { icon: '💰', label: 'Purchase' },
    message_request:   { icon: '💬', label: 'Message request' },
    request_accepted:  { icon: '✅', label: 'Request accepted' },
    review:            { icon: '⭐', label: 'Review' },
    warning:           { icon: '⚠️', label: 'Warning' },
};

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        getNotifications()
            .then(res => { if (!cancelled) setNotifications(res.data); })
            .catch(() => { if (!cancelled) setError('Failed to load notifications.'); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    const handleClick = (n) => {
        if (n.is_read) return;
        markRead(n.id)
            .then(() => {
                setNotifications(prev =>
                    prev.map(p => p.id === n.id ? { ...p, is_read: true } : p)
                );
            })
            .catch(() => {});
    };

    const handleMarkAllRead = () => {
        const unread = notifications.filter(n => !n.is_read);
        unread.forEach(n => markRead(n.id).catch(() => {}));
        setNotifications(prev => prev.map(p => ({ ...p, is_read: true })));
    };

    const handleDelete = (id, e) => {
        e.stopPropagation();
        deleteNotification(id)
            .then(() => {
                setNotifications(prev => prev.filter(n => n.id !== id));
            })
            .catch(() => {});
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
            <Navbar />
            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-20 md:pb-8">

                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Notifications</h1>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
                            {!loading && `${unreadCount} unread`}
                        </p>
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllRead}
                            className="text-xs text-[#9440dd] hover:underline transition"
                        >
                            Mark all as read
                        </button>
                    )}
                </div>

                {loading && (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-gray-200 dark:border-gray-700 border-t-[#9440dd] rounded-full animate-spin" />
                    </div>
                )}

                {error && (
                    <div className="text-center py-20 text-red-400 dark:text-red-500 text-sm">{error}</div>
                )}

                {!loading && !error && notifications.length === 0 && (
                    <div className="text-center py-20 text-gray-400 dark:text-gray-500 text-sm">
                        No notifications yet.
                    </div>
                )}

                {!loading && !error && notifications.length > 0 && (
                    <div className="flex flex-col gap-2">
                        {notifications.map(n => {
                            const meta = TYPE_META[n.notification_type] || { icon: '🔔', label: n.notification_type };
                            return (
                                <div
                                    key={n.id}
                                    onClick={() => handleClick(n)}
                                    className={`flex gap-3 p-4 rounded-xl border cursor-pointer transition
                                        ${n.is_read
                                        ? 'bg-white dark:bg-[#0a0a0a] border-gray-100 dark:border-gray-800'
                                        : 'bg-purple-50/50 dark:bg-[#1a1425] border-purple-100 dark:border-[#9440dd]/30'}`}
                                >
                                    <div className="text-xl flex-shrink-0">{meta.icon}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{meta.label}</span>
                                            {!n.is_read && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#9440dd]" />
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-900 dark:text-gray-100 mt-0.5">{n.message}</p>
                                        <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-1">
                                            {new Date(n.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => handleDelete(n.id, e)}
                                        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-gray-300 dark:text-gray-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-400 transition"
                                        aria-label="Remove notification"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="mt-8 text-center">
                    <Link to="/inbox" className="text-xs text-gray-400 dark:text-gray-500 hover:underline">
                        Looking for messages? Go to inbox →
                    </Link>
                </div>

            </div>
        </div>
    );
}