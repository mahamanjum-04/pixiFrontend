import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import ArtworkCard from '../components/ArtworkCard.jsx';
import { useAuth } from '../hooks/useAuthContext.jsx';
import api from '../services/api.js';

export default function PortfolioPage() {
    const { user }                  = useAuth();
    const [artworks, setArtworks]   = useState([]);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState('');
    const [filter, setFilter]       = useState('All');

    useEffect(() => {
        api.get('/api/artworks/')
            .then(res => {
                // only show this creator's artworks
                const mine = res.data.filter(a => a.creator === user?.id);
                setArtworks(mine);
            })
            .catch(() => setError('Failed to load artworks.'))
            .finally(() => setLoading(false));
    }, [user]);

    const filtered = artworks.filter(a => {
        if (filter === 'All') return true;
        return a.status === filter;
    });

    const stats = {
        total:     artworks.length,
        available: artworks.filter(a => a.status === 'available').length,
        sold:      artworks.filter(a => a.status === 'sold').length,
    };

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
            <Navbar />
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-20 md:pb-8">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">My portfolio</h1>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">@{user?.username}</p>
                    </div>
                    <Link
                        to="/upload"
                        className="bg-[#9440dd] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#7d36c0] transition"
                    >
                        + Upload artwork
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    {[
                        { label: 'Total',     value: stats.total     },
                        { label: 'Available', value: stats.available },
                        { label: 'Sold',      value: stats.sold      },
                    ].map(s => (
                        <div key={s.label} className="bg-gray-50 dark:bg-[#141414] border border-gray-100 dark:border-gray-800 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{s.value}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Filter tabs */}
                <div className="flex gap-2 mb-6">
                    {['All', 'available', 'sold'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition capitalize
                ${filter === f
                                ? 'bg-[#9440dd] text-white'
                                : 'bg-gray-100 dark:bg-[#141414] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#1e1e1e]'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* States */}
                {loading && (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-gray-200 dark:border-gray-700 border-t-[#9440dd] rounded-full animate-spin" />
                    </div>
                )}

                {error && (
                    <div className="text-center py-20 text-red-400 text-sm">{error}</div>
                )}

                {!loading && !error && artworks.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-gray-400 dark:text-gray-500 text-sm mb-4">You haven't uploaded any artworks yet.</p>
                        <Link
                            to="/upload"
                            className="bg-[#9440dd] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#7d36c0] transition"
                        >
                            Upload your first artwork
                        </Link>
                    </div>
                )}

                {!loading && !error && filtered.length === 0 && artworks.length > 0 && (
                    <div className="text-center py-20 text-gray-400 dark:text-gray-500 text-sm">
                        No artworks with status "{filter}".
                    </div>
                )}

                {!loading && !error && filtered.length > 0 && (
                    <div className="columns-2 sm:columns-3 lg:columns-4 gap-3">
                        {filtered.map(a => (
                            <ArtworkCard key={a.id} artwork={a} />
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
}