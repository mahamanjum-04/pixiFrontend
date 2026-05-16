import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ReviewForm from '../components/ReviewForm';
import { getArtwork, updateStatus, deleteArtwork } from '../services/artworks';
import { useAuth } from '../hooks/useAuthContext';
import api from '../services/api';
import SafeImage from '../components/SafeImage';

export default function ArtworkDetailPage() {
    const { id }       = useParams();
    const { user }     = useAuth();
    const navigate     = useNavigate();

    const [artwork, setArtwork]       = useState(null);
    const [reviews, setReviews]       = useState([]);
    const [loading, setLoading]       = useState(true);
    const [purchasing, setPurchasing] = useState(false);
    const [purchased, setPurchased]   = useState(false);
    const [showReview, setShowReview] = useState(false);
    const [error, setError]           = useState('');
    const [saved, setSaved]           = useState(false);
    const [savedId, setSavedId]       = useState(null);

    useEffect(() => {
        Promise.all([
            getArtwork(id),
            api.get(`/api/reviews/${id}/`),
        ])
            .then(([artRes, revRes]) => {
                setArtwork(artRes.data);
                setReviews(revRes.data);
            })
            .catch(() => setError('Failed to load artwork.'))
            .finally(() => setLoading(false));

        // check if saved
        if (user) {
            api.get(`/api/saved/check/${id}/`)
                .then(res => {
                    setSaved(res.data.is_saved);
                    setSavedId(res.data.saved_id);
                })
                .catch(() => {});
        }

        // check if already purchased
        if (user?.is_buyer) {
            api.get('/api/purchases/')
                .then(res => {
                    const hasPurchased = res.data.some(p => p.artwork === parseInt(id));
                    setPurchased(hasPurchased);
                })
                .catch(() => {});
        }
    }, [id, user]);

    const toggleSave = async () => {
        try {
            if (saved) {
                await api.delete(`/api/saved/${savedId}/`);
                setSaved(false);
                setSavedId(null);
            } else {
                const res = await api.post('/api/saved/', { artwork: parseInt(id) });
                setSaved(true);
                setSavedId(res.data.id);
            }
        } catch (err) {
            console.error('Save error:', err);
        }
    };

    const handlePurchase = async () => {
        setPurchasing(true);
        try {
            // create intent then confirm
            const intentRes = await api.post('/api/purchases/create-intent/', { artwork: artwork.id });
            await api.post('/api/purchases/confirm/', {
                payment_intent_id: intentRes.data.client_secret.split('_secret_')[0],
                artwork: artwork.id,
            });
            setPurchased(true);
            setArtwork(a => ({ ...a, status: 'sold' }));
            alert('Purchase successful!');
        } catch (err) {
            alert(err.response?.data?.error || 'Purchase failed.');
        } finally {
            setPurchasing(false);
        }
    };

    const handleStatusChange = async (status) => {
        try {
            const res = await updateStatus(id, status);
            setArtwork(res.data);
        } catch { alert('Failed to update status.'); }
    };

    const handleDelete = async () => {
        if (!confirm('Delete this artwork?')) return;
        try {
            await deleteArtwork(id);
            navigate('/portfolio');
        } catch { alert('Failed to delete.'); }
    };

    const handleReviewSubmitted = (newReview) => {
        setReviews(r => [newReview, ...r]);
        setShowReview(false);
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
            </div>
        </div>
    );

    if (error || !artwork) return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="text-center py-20 text-gray-400">{error || 'Artwork not found.'}</div>
        </div>
    );

    const isOwner    = user?.is_creator && artwork.creator === user.id;
    const canBuy     = user?.is_buyer && artwork.status === 'available' && !purchased;
    const canReview  = user?.is_buyer && purchased && !reviews.some(r => r.reviewer === user.id);
    const avgRating  = reviews.length
        ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
        : null;

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-5xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

                    {/* Image */}
                    <div className="rounded-2xl overflow-hidden border border-gray-100 bg-white aspect-square">
                        <SafeImage
                            src={artwork.image}
                            alt={artwork.title}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Info */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-2xl font-semibold text-gray-900">{artwork.title}</h1>
                                <p className="text-sm text-gray-400 mt-1">by {artwork.creator_name}</p>
                            </div>
                            {user && (
                                <button onClick={toggleSave} className="text-2xl hover:scale-110 transition">
                                    {saved ? '❤️' : '🤍'}
                                </button>
                            )}
                        </div>

                        {/* Meta */}
                        <div className="flex flex-wrap gap-2">
                            <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600 capitalize">{artwork.medium}</span>
                            {artwork.dimensions && (
                                <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600">{artwork.dimensions}</span>
                            )}
                            <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                                artwork.status === 'available' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-500'
                            }`}>
                {artwork.status}
              </span>
                        </div>

                        {artwork.description && (
                            <p className="text-sm text-gray-600 leading-relaxed">{artwork.description}</p>
                        )}

                        <p className="text-3xl font-bold text-gray-900">${artwork.price}</p>

                        {avgRating && (
                            <p className="text-sm text-gray-500">⭐ {avgRating} ({reviews.length} review{reviews.length !== 1 ? 's' : ''})</p>
                        )}

                        {/* Actions */}
                        <div className="flex flex-col gap-3 mt-2">

                            {/* Buyer actions */}
                            {canBuy && (
                                <button
                                    onClick={handlePurchase}
                                    disabled={purchasing}
                                    className="w-full bg-black text-white py-3 rounded-xl text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50"
                                >
                                    {purchasing ? 'Processing...' : `Purchase for $${artwork.price}`}
                                </button>
                            )}

                            {purchased && (
                                <div className="w-full text-center py-3 rounded-xl text-sm font-medium bg-green-50 text-green-700">
                                    ✓ You own this artwork
                                </div>
                            )}

                            {canReview && !showReview && (
                                <button
                                    onClick={() => setShowReview(true)}
                                    className="w-full border border-gray-200 py-3 rounded-xl text-sm font-medium text-gray-600 hover:border-black transition"
                                >
                                    Leave a review
                                </button>
                            )}

                            {/* Message creator */}
                            {user?.is_buyer && !isOwner && (
                                <button
                                    onClick={() => navigate(`/inbox?request=${artwork.creator}&artwork=${artwork.id}`)}
                                    className="w-full border border-gray-200 py-3 rounded-xl text-sm font-medium text-gray-600 hover:border-black transition"
                                >
                                    Message creator
                                </button>
                            )}

                            {/* Creator actions */}
                            {isOwner && (
                                <div className="flex flex-col gap-2">
                                    <select
                                        value={artwork.status}
                                        onChange={e => handleStatusChange(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black"
                                    >
                                        <option value="available">Available</option>
                                        <option value="sold">Sold</option>
                                    </select>
                                    <button
                                        onClick={handleDelete}
                                        className="w-full border border-red-100 text-red-500 py-2.5 rounded-xl text-sm hover:bg-red-50 transition"
                                    >
                                        Delete artwork
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Review form */}
                        {showReview && (
                            <ReviewForm
                                artworkId={artwork.id}
                                onSubmitted={handleReviewSubmitted}
                                onCancel={() => setShowReview(false)}
                            />
                        )}
                    </div>
                </div>

                {/* Reviews */}
                {reviews.length > 0 && (
                    <div className="mt-12">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Reviews</h2>
                        <div className="flex flex-col gap-4">
                            {reviews.map(r => (
                                <div key={r.id} className="bg-white border border-gray-100 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-gray-800">{r.reviewer_name}</span>
                                        <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="text-sm text-yellow-500 mb-1">{'⭐'.repeat(r.rating)}</div>
                                    <p className="text-sm text-gray-600">{r.comment}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}