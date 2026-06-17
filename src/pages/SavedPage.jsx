import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import SafeImage from '../components/SafeImage.jsx';
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
                            <div key={s.id} className="group bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition">

                                {/* Image */}
                                <Link to={`/artworks/${s.artwork}`}>
                                    <div className="relative aspect-square bg-gray-50">
                                        {s.artwork_image
                                            ? <SafeImage
                                                src={s.artwork_image}
                                                alt={s.artwork_title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                            />
                                            : <div className="w-full h-full flex items-center justify-center text-gray-200 text-4xl">🖼</div>
                                        }
                                        <span className={`absolute bottom-2 left-2 text-xs px-2 py-0.5 rounded-full font-medium ${
                                            s.artwork_status === 'available'
                                                ? 'bg-green-50 text-green-700'
                                                : 'bg-red-50 text-red-500'
                                        }`}>
                      {s.artwork_status}
                    </span>
                                    </div>
                                </Link>

                                {/* Info */}
                                <div className="p-3">
                                    <Link to={`/artworks/${s.artwork}`}>
                                        <p className="text-sm font-medium text-gray-900 truncate hover:underline">
                                            {s.artwork_title}
                                        </p>
                                    </Link>
                                    <p className="text-xs text-gray-400 truncate">{s.creator_name}</p>
                                    <div className="flex items-center justify-between mt-2">
                                        <p className="text-sm font-semibold text-gray-900">${s.artwork_price}</p>
                                        <button
                                            onClick={() => handleUnsave(s.id)}
                                            className="text-xs text-gray-300 hover:text-red-400 transition"
                                        >
                                            ❤️ Remove
                                        </button>
                                    </div>
                                </div>

                            </div>
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
}