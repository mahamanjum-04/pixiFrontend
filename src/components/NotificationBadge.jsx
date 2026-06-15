import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';

export default function NotificationBadge() {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const fetchCount = () => {
            api.get('/api/notifications/unread-count/')
                .then(res => setCount(res.data.unread_count))
                .catch(() => {});
        };
        fetchCount();
        const interval = setInterval(fetchCount, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <Link to="/inbox" className="relative">
            <span className="text-sm text-gray-500 hover:text-black">🔔</span>
            {count > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-black text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
          {count > 9 ? '9+' : count}
        </span>
            )}
        </Link>
    );
}