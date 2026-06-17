import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api.js';

export default function NotificationBadge() {
    const [count, setCount] = useState(0);
    const navigate = useNavigate();

    const fetchCount = useCallback(() => {
        api.get('/api/notifications/')
            .then(res => setCount(res.data.filter(n => !n.read).length))
            .catch(() => {});
    }, []);

    useEffect(() => {
        fetchCount();
        const interval = setInterval(fetchCount, 30000);
        return () => clearInterval(interval);
    }, [fetchCount]);

    const markAllAndNavigate = async (e) => {
        e.preventDefault();
        try {
            const res = await api.get('/api/notifications/');
            const unread = res.data.filter(n => !n.read);
            await Promise.all(unread.map(n => api.patch(`/api/notifications/${n.id}/read/`)));
            setCount(0);
        } catch {
            // silently fail
        }
        navigate('/inbox');
    };

    return (
        <Link to="/inbox" onClick={markAllAndNavigate} className="relative">
            <span className="text-sm text-gray-500 hover:text-black">🔔</span>
            {count > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
          {count > 9 ? '9+' : count}
        </span>
            )}
        </Link>
    );
}
