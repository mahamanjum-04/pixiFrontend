import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';

export default function NotificationBadge() {
    const [count, setCount] = useState(0);

    const fetchCount = useCallback(() => {
        api.get('/api/message-requests/')
            .then(res => setCount(res.data.filter(r => r.status === 'pending').length))
            .catch(() => {});
    }, []);

    useEffect(() => {
        fetchCount();
        const interval = setInterval(fetchCount, 30000);
        return () => clearInterval(interval);
    }, [fetchCount]);

    return (
        <Link to="/inbox" className="relative">
            <span className="text-sm text-gray-500 hover:text-black">🔔</span>
            {count > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
          {count > 9 ? '9+' : count}
        </span>
            )}
        </Link>
    );
}