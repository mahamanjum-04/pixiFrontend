import { useState, useEffect  } from 'react';
import { useNavigate } from 'react-router-dom';
import InterestsPicker from '../components/InterestsPicker';
import { getInterests, saveInterests } from '../services/interests';
import { useAuth } from '../hooks/useAuthContext';

export default function InterestsPage() {
    const { login, user }       = useAuth();
    const navigate               = useNavigate();
    const [selected, setSelected] = useState([]);
    const [loading, setLoading]   = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error, setError]       = useState('');

    useEffect(() => {
        let cancelled = false;
        getInterests()
            .then(res => {
                if (!cancelled) setSelected(res.data.interests || []);
            })
            .catch(() => {})
            .finally(() => { if (!cancelled) setFetching(false); });
        return () => { cancelled = true; };
    }, []);

    const handleContinue = async () => {
        if (selected.length === 0) {
            setError('Please select at least one interest.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await saveInterests(selected);
            // update user in context so has_set_interests is true
            const tokens = {
                access:  localStorage.getItem('access_token'),
                refresh: localStorage.getItem('refresh_token'),
            };
            login(tokens, { ...user, has_set_interests: true, interests: selected });
            navigate('/browse');
        } catch {
            setError('Failed to save interests. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = () => navigate('/browse');

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

                <h1 className="text-2xl font-semibold text-gray-900 mb-1">What are you into?</h1>
                <p className="text-sm text-gray-400 mb-6">
                    Pick the styles and mediums you love — we'll personalise your feed.
                </p>

                {error && (
                    <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
                        {error}
                    </div>
                )}

                {fetching
                    ? <div className="flex justify-center py-8">
                        <div className="w-6 h-6 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
                    </div>
                    : <>
                        <InterestsPicker selected={selected} onChange={setSelected} />
                        <p className="text-xs text-gray-300 mt-4">{selected.length} selected</p>
                    </>
                }

                <p className="text-xs text-gray-300 mt-4">
                    {selected.length} selected
                </p>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={handleContinue}
                        disabled={loading}
                        className="flex-1 bg-black text-white py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Continue'}
                    </button>
                    <button
                        onClick={handleSkip}
                        className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-400 hover:border-gray-400 transition"
                    >
                        Skip
                    </button>
                </div>

            </div>
        </div>
    );
}