import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import ReviewForm from '../components/ReviewForm.jsx';
import api from '../services/api.js';

export default function PurchasedPage() {
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState('');
    const [reviewingId, setReviewingId] = useState(null); // artwork id currently being reviewed

    useEffect(() => {
        let cancelled = false;

        const fetchPurchases = async () => {
            try {
                const res = await api.get('/api/purchases/');
                if (!cancelled) setPurchases(res.data);
            } catch {
                if (!cancelled) setError('Failed to load purchases.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchPurchases();
        return () => { cancelled = true; };
    }, []);

    const handleReviewSubmitted = (artworkId) => {
        setReviewingId(null);
        // mark this purchase as reviewed locally so button disappears
        setPurchases(prev =>
            prev.map(p => p.artwork === artworkId ? { ...p, reviewed: true } : p)
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-4xl mx-auto px-6 py-8">

                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900">My purchases</h1>
                    <p className="text-sm text-gray-400 mt-0.5">
                        {!loading && `${purchases.length} artwork${purchases.length !== 1 ? 's' : ''} purchased`}
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
                {!loading && !error && purchases.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-gray-400 text-sm mb-4">You haven't purchased any artworks yet.</p>
                        <Link
                            to="/browse"
                            className="bg-black text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition"
                        >
                            Browse artworks
                        </Link>
                    </div>
                )}

                {/* List */}
                {!loading && !error && purchases.length > 0 && (
                    <div className="flex flex-col gap-4">
                        {purchases.map(p => (
                            <div key={p.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                                <div className="flex gap-4 p-4">

                                    {/* Thumbnail */}
                                    <Link to={`/artworks/${p.artwork}`} className="flex-shrink-0">
                                        <div className="w-20 h-20 rounded-lg bg-gray-50 overflow-hidden border border-gray-100">
                                            <div className="w-full h-full flex items-center justify-center text-gray-200 text-2xl">
                                                🖼
                                            </div>
                                        </div>
                                    </Link>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <Link to={`/artworks/${p.artwork}`}>
                                            <p className="text-sm font-medium text-gray-900 hover:underline truncate">
                                                {p.artwork_title}
                                            </p>
                                        </Link>
                                        <p className="text-xs text-gray-400 mt-0.5">by {p.buyer_name}</p>
                                        <p className="text-xs text-gray-300 mt-0.5">
                                            {new Date(p.purchased_at).toLocaleDateString()}
                                        </p>
                                        <p className="text-sm font-semibold text-gray-900 mt-1">${p.amount_paid}</p>
                                    </div>

                                    {/* Review button */}
                                    <div className="flex-shrink-0 flex items-start">
                                        {!p.reviewed && reviewingId !== p.artwork && (
                                            <button
                                                onClick={() => setReviewingId(p.artwork)}
                                                className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg text-gray-500 hover:border-black hover:text-black transition"
                                            >
                                                Leave review
                                            </button>
                                        )}
                                        {p.reviewed && (
                                            <span className="text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">
                        ✓ Reviewed
                      </span>
                                        )}
                                    </div>

                                </div>

                                {/* Inline review form */}
                                {reviewingId === p.artwork && (
                                    <div className="px-4 pb-4">
                                        <ReviewForm
                                            artworkId={p.artwork}
                                            onSubmitted={() => handleReviewSubmitted(p.artwork)}
                                            onCancel={() => setReviewingId(null)}
                                        />
                                    </div>
                                )}

                            </div>
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
}