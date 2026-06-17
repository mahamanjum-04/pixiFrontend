import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import ArtworkCard from '../components/ArtworkCard.jsx';
import api from '../services/api.js';

export default function SavedPage() {
    const [saved, setSaved]     = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState('');

    useEffect(() => {
        let cancelled = false;

        const fetchSaved = async () => {
            try {
                const res = await api.get('/api/saved/');
                if (!cancelled) setSaved(res.data);
            } catch {
                if (!cancelled) setError('Failed to load saved artworks.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchSaved();
        return () => { cancelled = true; };
    }, []);

    const handleUnsave = async (savedId) => {
        try {
            await api.delete(`/api/saved/${savedId}/`);
            setSaved(prev => prev.filter(s => s.id !== savedId));
        } catch {
            alert('Failed to remove.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-6xl mx-auto px-6 py-8">

                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900">Saved artworks</h1>
                    <p className="text-sm text-gray-400 mt-0.5">
                        {!loading && `${saved.length} artwork${saved.length !== 1 ? 's' : ''}`}
                    </p>
                </div>

                {/* Loading */}
                {loading && (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="text-center py-20 text-red-400 text-sm">{error}</div>
                )}

                {/* Empty */}
                {!loading && !error && saved.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-gray-400 text-sm mb-4">You haven't saved any artworks yet.</p>
                        <Link
                            to="/browse"
                            className="bg-black text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition"
                        >
                            Browse artworks
                        </Link>
                    </div>
                )}

                {/* Grid */}
                {!loading && !error && saved.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {saved.map(s => (
                            <ArtworkCard
                                key={s.id}
                                artwork={{
                                    id: s.artwork,
                                    image: s.artwork_image,
                                    title: s.artwork_title,
                                    creator_name: s.creator_name,
                                    price: s.artwork_price,
                                    status: s.artwork_status,
                                    is_saved: true,
                                    saved_id: s.id,
                                }}
                            />
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
}