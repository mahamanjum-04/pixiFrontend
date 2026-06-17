import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import ArtworkCard from '../components/ArtworkCard.jsx';
import { getArtwork } from '../services/artworks.js';
import api from '../services/api.js';

export default function SavedPage() {
    const [artworks, setArtworks]   = useState([]);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState('');

    useEffect(() => {
        let cancelled = false;

        const fetchSaved = async () => {
            try {
                const res = await api.get('/api/saved/');
                if (cancelled) return;

                const savedItems = res.data;

                // Fetch full artwork details for each saved item
                const fullArtworks = await Promise.all(
                    savedItems.map(s =>
                        getArtwork(s.artwork)
                            .then(r => ({
                                ...r.data,
                                is_saved: true,
                                saved_id: s.id,
                            }))
                            .catch(() => null)
                    )
                );

                if (!cancelled) {
                    setArtworks(fullArtworks.filter(Boolean));
                }
            } catch {
                if (!cancelled) setError('Failed to load saved artworks.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchSaved();
        return () => { cancelled = true; };
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-6xl mx-auto px-6 py-8">

                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900">Saved artworks</h1>
                    <p className="text-sm text-gray-400 mt-0.5">
                        {!loading && `${artworks.length} artwork${artworks.length !== 1 ? 's' : ''}`}
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
                {!loading && !error && artworks.length === 0 && (
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

                {/* Grid — identical to BrowsePage */}
                {!loading && !error && artworks.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {artworks.map(a => (
                            <ArtworkCard key={a.id} artwork={a} />
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
}