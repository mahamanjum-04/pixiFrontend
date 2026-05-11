import { useState } from 'react';
import api from '../services/api';

export default function ReviewForm({ artworkId, onSubmitted, onCancel }) {
    const [rating, setRating]   = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState('');

    const handleSubmit = async () => {
        if (rating === 0) { setError('Please select a rating.'); return; }
        setLoading(true);
        try {
            const res = await api.post(`/api/reviews/${artworkId}/`, { rating, comment });
            onSubmitted(res.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to submit review.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="border border-gray-100 rounded-xl p-4 bg-gray-50">
            <p className="text-sm font-medium text-gray-800 mb-3">Leave a review</p>

            {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

            {/* Stars */}
            <div className="flex gap-1 mb-3">
                {[1,2,3,4,5].map(s => (
                    <button
                        key={s}
                        onClick={() => setRating(s)}
                        className={`text-2xl transition hover:scale-110 ${s <= rating ? 'text-yellow-400' : 'text-gray-200'}`}
                    >
                        ★
                    </button>
                ))}
            </div>

            <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Share your thoughts..."
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none"
            />

            <div className="flex gap-2 mt-3">
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 bg-black text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50"
                >
                    {loading ? 'Submitting...' : 'Submit'}
                </button>
                <button
                    onClick={onCancel}
                    className="flex-1 border border-gray-200 py-2 rounded-lg text-sm text-gray-500 hover:border-gray-400 transition"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}