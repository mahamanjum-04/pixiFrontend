import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ArtworkCard from '../components/ArtworkCard';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

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
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-6xl mx-auto px-6 py-8">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">My portfolio</h1>
                        <p className="text-sm text-gray-400 mt-0.5">@{user?.username}</p>
                    </div>
                    <Link
                        to="/upload"
                        className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition"
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
                        <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Filter tabs */}
                <div className="flex gap-2 mb-6">
                    {['All', 'available', 'sold'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition capitalize
                ${filter === f
                                ? 'bg-black text-white border-black'
                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* States */}
                {loading && (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
                    </div>
                )}

                {error && (
                    <div className="text-center py-20 text-red-400 text-sm">{error}</div>
                )}

                {!loading && !error && artworks.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-gray-400 text-sm mb-4">You haven't uploaded any artworks yet.</p>
                        <Link
                            to="/upload"
                            className="bg-black text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition"
                        >
                            Upload your first artwork
                        </Link>
                    </div>
                )}

                {!loading && !error && filtered.length === 0 && artworks.length > 0 && (
                    <div className="text-center py-20 text-gray-400 text-sm">
                        No artworks with status "{filter}".
                    </div>
                )}

                {!loading && !error && filtered.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filtered.map(a => (
                            <ArtworkCard key={a.id} artwork={a} />
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
}