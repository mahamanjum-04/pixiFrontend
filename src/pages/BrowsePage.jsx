import api from '../services/api';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ArtworkCard from '../components/ArtworkCard';
import { useAuth } from '../hooks/useAuthContext';

const MEDIUMS = ['All', 'oil', 'watercolor', 'acrylic', 'digital', 'pencil', 'other'];

export default function BrowsePage() {
    const [artworks, setArtworks] = useState([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState('');
    const [medium, setMedium]     = useState('All');
    const [status, setStatus]     = useState('All');
    const [maxPrice, setMaxPrice] = useState('');
    const { user } = useAuth();

    useEffect(() => {
        setLoading(true);
        const endpoint = user ? '/api/artworks/personalised/' : '/api/artworks/';
        api.get(endpoint)
            .then(res => setArtworks(res.data))
            .catch(() => setError('Failed to load artworks.'))
            .finally(() => setLoading(false));
    }, [user]);

    const filtered = artworks.filter(a => {
        if (medium !== 'All' && a.medium !== medium) return false;
        if (status !== 'All' && a.status !== status) return false;
        if (maxPrice && parseFloat(a.price) > parseFloat(maxPrice)) return false;
        return true;
    });

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-6xl mx-auto px-6 py-8">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">Browse artworks</h1>
                        <p className="text-sm text-gray-400 mt-0.5">
                            {loading ? 'Loading...' : `${filtered.length} artworks${user ? ' · personalised for you' : ''}`}
                        </p>
                    </div>
                    <Link to="/search" className="text-sm text-gray-500 hover:text-black underline underline-offset-2">
                        AI search →
                    </Link>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3 mb-8">
                    <select
                        value={medium}
                        onChange={e => setMedium(e.target.value)}
                        className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black"
                    >
                        {MEDIUMS.map(m => <option key={m}>{m}</option>)}
                    </select>

                    <select
                        value={status}
                        onChange={e => setStatus(e.target.value)}
                        className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black"
                    >
                        {['All', 'available', 'sold'].map(s => (
                            <option key={s} value={s}>
                                {s === 'All' ? 'All statuses' : s}
                            </option>
                        ))}
                    </select>

                    <input
                        type="number"
                        placeholder="Max price $"
                        value={maxPrice}
                        onChange={e => setMaxPrice(e.target.value)}
                        className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black w-32"
                    />

                    {(medium !== 'All' || status !== 'All' || maxPrice) && (
                        <button
                            onClick={() => { setMedium('All'); setStatus('All'); setMaxPrice(''); }}
                            className="px-3 py-2 text-sm text-gray-400 hover:text-black transition"
                        >
                            Clear filters
                        </button>
                    )}
                </div>

                {/* States */}
                {loading && (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
                    </div>
                )}

                {error && (
                    <div className="text-center py-20 text-red-500 text-sm">{error}</div>
                )}

                {!loading && !error && filtered.length === 0 && (
                    <div className="text-center py-20 text-gray-400">No artworks found.</div>
                )}

                {!loading && !error && filtered.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filtered.map(a => <ArtworkCard key={a.id} artwork={a} />)}
                    </div>
                )}

            </div>
        </div>
    );
}