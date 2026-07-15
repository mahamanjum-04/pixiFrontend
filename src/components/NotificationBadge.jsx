import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getUnreadCount } from '../services/notifications.js';

export default function NotificationBadge() {
    const [count, setCount] = useState(0);

    const fetchCount = useCallback(() => {
        getUnreadCount()
            .then(res => setCount(res.data.unread_count))
            .catch(() => {});
    }, []);

    useEffect(() => {
        fetchCount();
        const interval = setInterval(fetchCount, 30000);
        return () => clearInterval(interval);
    }, [fetchCount]);

    return (
        <Link to="/notifications" className="relative w-9 h-9 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#0a0a0a] transition">            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#9440dd] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {count > 9 ? '9+' : count}
                </span>
            )}
        </Link>
    );
}