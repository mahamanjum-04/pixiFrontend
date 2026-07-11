import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import ReviewForm from '../components/ReviewForm.jsx';
import { getArtwork, updateStatus, updateArtwork, deleteArtwork } from '../services/artworks.js';
import { getReviews } from '../services/reviews.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { createIntent, getPurchases } from '../services/purchases.js';
import api from '../services/api.js';
import SafeImage from '../components/SafeImage.jsx';
import { resolveImage } from '../utils/image.js';
import { trackClick } from '../services/tracking.js';
import { submitReport } from '../services/admin.js';
import PurchaseModal from '../components/PurchaseModal.jsx';

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
    const [showReport, setShowReport] = useState(false);
    const [reportReason, setReportReason]   = useState('inappropriate');
    const [reportDesc, setReportDesc]       = useState('');
    const [reportLoading, setReportLoading] = useState(false);
    const [reportSuccess, setReportSuccess] = useState('');
    const [reportError, setReportError]     = useState('');
    const [clientSecret, setClientSecret] = useState(null);
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);

    useEffect(() => {
        if (user) trackClick(parseInt(id));
        Promise.all([
            getArtwork(id),
            getReviews(id),
        ])
            .then(([artRes, revRes]) => {
                setArtwork(artRes.data);
                setReviews(revRes.data);
            })
            .catch(() => setError('Failed to load artwork.'))
            .finally(() => setLoading(false));

        if (user) {
            api.get(`/api/saved/check/${id}/`)
                .then(res => {
                    setSaved(res.data.is_saved);
                    setSavedId(res.data.saved_id);
                })
                .catch(() => {});
        }

        if (user?.is_buyer) {
            getPurchases()
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

            const intentRes = await createIntent(artwork.id);

            setClientSecret(intentRes.data.client_secret);

            setShowPurchaseModal(true);

        } catch (err) {

            alert(err.response?.data?.error || 'Could not start checkout.');

        } finally {

            setPurchasing(false);

        }

    };

    const handlePurchaseSuccess = () => {

        setShowPurchaseModal(false);

        setPurchased(true);

        setArtwork(a => ({ ...a, status: 'sold' }));

        alert('Purchase successful!');

    };

    const handleStatusChange = async (status) => {
        try {
            let res;
            if (status === 'not_for_sale') {
                const formData = new FormData();
                formData.append('status', status);
                res = await updateArtwork(id, formData);
            } else {
                res = await updateStatus(id, status);
            }
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

    const handleReport = async () => {
        setReportLoading(true);
        setReportError('');
        setReportSuccess('');
        try {
            await submitReport({
                reported_artwork: parseInt(id),
                reported_user:    null,
                reason:           reportReason,
                description:      reportDesc || `Reported artwork: ${artwork?.title}`,
            });
            setReportSuccess('Report submitted. Our team will review it shortly.');
            setReportDesc('');
            setTimeout(() => {
                setShowReport(false);
                setReportSuccess('');
            }, 2500);
        } catch {
            setReportError('Failed to submit report. Please try again.');
        } finally {
            setReportLoading(false);
        }
    };

    const REASONS = ['inappropriate', 'spam', 'harassment', 'fake', 'other'];

    if (loading) return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
            <Navbar />
            <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-4 border-gray-200 dark:border-gray-700 border-t-[#9440dd] rounded-full animate-spin" />
            </div>
        </div>
    );

    if (error || !artwork) return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
            <Navbar />
            <div className="text-center py-20 text-gray-400 dark:text-gray-500">{error || 'Artwork not found.'}</div>
        </div>
    );

    const isOwner    = user?.is_creator && artwork.creator === user.id;
    const canBuy     = user?.is_buyer && artwork.status === 'available' && !purchased;
    const canReview  = user?.is_buyer && purchased && !reviews.some(r => r.reviewer === user.id);
    const avgRating  = reviews.length
        ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
        : null;

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
            <Navbar />
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-20 md:pb-8">

                {/* Back arrow */}
                <button
                    onClick={() => navigate(-1)}
                    className="mb-4 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                </button>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-8">

                    {/* Image — 60% on desktop */}
                    <div className="md:col-span-3 relative">
                        <div className="rounded-2xl overflow-hidden bg-gray-50 dark:bg-[#141414]">
                            <SafeImage
                                src={resolveImage(artwork.image)}
                                alt={artwork.title}
                                className="w-full h-auto"
                            />
                        </div>
                        {user && (
                            <button
                                onClick={toggleSave}
                                className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/90 dark:bg-[#1e1e1e]/90 shadow-md flex items-center justify-center hover:scale-110 transition"
                            >
                                {saved
                                    ? <img src="/assets/liked-button.png" alt="Liked" className="w-5 h-5" />
                                    : <img src="/assets/like-button.png" alt="Save" className="w-5 h-5" />
                                }
                            </button>
                        )}
                    </div>

                    {/* Info — 40% on desktop */}
                    <div className="md:col-span-2 flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <Link
                                to={`/profile/${artwork.creator}`}
                                className="w-10 h-10 rounded-full bg-[#9440dd] flex items-center justify-center text-sm font-semibold text-white flex-shrink-0 hover:opacity-80 transition"
                            >
                                {artwork.creator_name?.[0]?.toUpperCase() || 'U'}
                            </Link>
                            <Link
                                to={`/profile/${artwork.creator}`}
                                className="text-sm text-gray-500 dark:text-gray-400 hover:text-[#9440dd] dark:hover:text-[#9440dd] transition"
                            >
                                {artwork.creator_name}
                            </Link>
                            <button
                                onClick={() => setShowReport(r => !r)}
                                className="ml-auto text-xs text-gray-300 dark:text-gray-600 hover:text-red-400 transition"
                            >
                                ⚑ Report
                            </button>
                        </div>

                        {/* Report panel */}
                        {showReport && (
                            <div className="bg-gray-50 dark:bg-[#141414] border border-gray-100 dark:border-gray-800 rounded-xl p-4">
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">Report this artwork</p>

                                {reportSuccess && (
                                    <p className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg mb-3">
                                        {reportSuccess}
                                    </p>
                                )}
                                {reportError && (
                                    <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg mb-3">
                                        {reportError}
                                    </p>
                                )}

                                <div className="mb-3">
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Reason</label>
                                    <div className="flex flex-wrap gap-2">
                                        {REASONS.map(r => (
                                            <button
                                                key={r}
                                                onClick={() => setReportReason(r)}
                                                className={`px-3 py-1 rounded-full text-xs border transition capitalize
                                                    ${reportReason === r
                                                        ? 'bg-[#9440dd] text-white border-[#9440dd]'
                                                        : 'bg-white dark:bg-[#0a0a0a] text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-400'
                                                    }`}
                                            >
                                                {r}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                        Additional details (optional)
                                    </label>
                                    <textarea
                                        value={reportDesc}
                                        onChange={e => setReportDesc(e.target.value)}
                                        placeholder="Describe the issue..."
                                        rows={2}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#9440dd] resize-none"
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={handleReport}
                                        disabled={reportLoading}
                                        className="flex-1 bg-red-500 text-white py-2 rounded-lg text-xs font-medium hover:bg-red-600 transition disabled:opacity-50"
                                    >
                                        {reportLoading ? 'Submitting...' : 'Submit report'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowReport(false);
                                            setReportError('');
                                            setReportDesc('');
                                        }}
                                        className="flex-1 border border-gray-200 dark:border-gray-700 py-2 rounded-lg text-xs text-gray-500 dark:text-gray-400 hover:border-gray-400 transition"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{artwork.title}</h1>

                        <p className="text-3xl font-bold text-[#9440dd]">${artwork.price}</p>

                        <div className="flex flex-wrap gap-2">
                            <span className="text-xs px-3 py-1 rounded-full bg-gray-100 dark:bg-[#141414] text-gray-600 dark:text-gray-400 capitalize border border-gray-200 dark:border-gray-700">{artwork.medium}</span>
                            {artwork.dimensions && (
                                <span className="text-xs px-3 py-1 rounded-full bg-gray-100 dark:bg-[#141414] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">{artwork.dimensions}</span>
                            )}
                            <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                                artwork.status === 'available'
                                    ? 'bg-[#9440dd]/10 text-[#9440dd]'
                                    : 'bg-gray-100 dark:bg-[#141414] text-gray-500'
                            }`}>
                                {artwork.status?.replace('_', ' ')}
                            </span>
                        </div>

                        {artwork.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{artwork.description}</p>
                        )}

                        {avgRating && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">⭐ {avgRating} ({reviews.length} review{reviews.length !== 1 ? 's' : ''})</p>
                        )}

                        <div className="flex flex-col gap-3 mt-2">
                            {canBuy && (
                                <button
                                    onClick={handlePurchase}
                                    disabled={purchasing}
                                    className="w-full bg-[#9440dd] text-white py-3 rounded-xl text-sm font-medium hover:bg-[#7d36c0] transition disabled:opacity-50"
                                >
                                    {purchasing ? 'Processing...' : `Purchase for $${artwork.price}`}
                                </button>
                            )}

                            {purchased && (
                                <div className="w-full text-center py-3 rounded-xl text-sm font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-800">
                                    ✓ You own this artwork
                                </div>
                            )}

                            {showPurchaseModal && (
                                <PurchaseModal
                                    artwork={artwork}
                                    clientSecret={clientSecret}
                                    onSuccess={handlePurchaseSuccess}
                                    onClose={() => setShowPurchaseModal(false)}
                                />
                            )}

                            {canReview && !showReview && (
                                <button
                                    onClick={() => setShowReview(true)}
                                    className="w-full border border-gray-200 dark:border-gray-700 py-3 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:border-[#9440dd] hover:text-[#9440dd] transition"
                                >
                                    Leave a review
                                </button>
                            )}

                            {user?.is_buyer && !isOwner && (
                                <button
                                    onClick={() => navigate(`/inbox?request=${artwork.creator}&artwork=${artwork.id}`)}
                                    className="w-full border border-[#9440dd] text-[#9440dd] py-3 rounded-xl text-sm font-medium hover:bg-[#9440dd]/5 transition"
                                >
                                    Message creator
                                </button>
                            )}

                            {isOwner && (
                                <div className="flex flex-col gap-2">
                                    <select
                                        value={artwork.status}
                                        onChange={e => handleStatusChange(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-[#141414] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#9440dd]"
                                    >
                                        <option value="available">Available</option>
                                        <option value="sold">Sold</option>
                                        <option value="not_for_sale">Not for sale</option>
                                    </select>
                                    <button
                                        onClick={handleDelete}
                                        className="w-full border border-red-200 dark:border-red-800 text-red-500 py-2.5 rounded-xl text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                                    >
                                        Delete artwork
                                    </button>
                                </div>
                            )}
                        </div>

                        {showReview && (
                            <ReviewForm
                                artworkId={artwork.id}
                                onSubmitted={handleReviewSubmitted}
                                onCancel={() => setShowReview(false)}
                            />
                        )}
                    </div>
                </div>

                {reviews.length > 0 && (
                    <div className="mt-12">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Reviews</h2>
                        <div className="flex flex-col gap-4">
                            {reviews.map(r => (
                                <div key={r.id} className="bg-gray-50 dark:bg-[#141414] border border-gray-100 dark:border-gray-800 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{r.reviewer_name}</span>
                                        <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(r.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="text-sm text-yellow-500 mb-1">{'⭐'.repeat(r.rating)}</div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{r.comment}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}