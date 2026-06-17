import { useState, useEffect  } from 'react';
import { useNavigate } from 'react-router-dom';
import InterestsPicker from '../components/InterestsPicker.jsx';
import { getInterests, saveInterests } from '../services/interests.js';
import { useAuth } from '../hooks/useAuthContext.jsx';
import useDarkMode from '../hooks/useDarkMode.js';

export default function InterestsPage() {
    const { login, user }       = useAuth();
    const navigate               = useNavigate();
    const [dark]                 = useDarkMode();
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
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex items-center justify-center px-4">
            <div className="w-full max-w-lg bg-gray-50 dark:bg-[#141414] rounded-2xl border border-gray-100 dark:border-gray-800 p-8">

                {/* Logo */}
                <div className="flex justify-center mb-4">
                    <img
                        src={dark ? "/src/assets/dark-logo.png" : "/src/assets/light-logo.png"}
                        alt="PIXI"
                        className="h-8"
                    />
                </div>

                <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-1 text-center">What are you into?</h1>
                <p className="text-sm text-gray-400 dark:text-gray-500 mb-6 text-center">
                    Pick the styles and mediums you love — we'll personalise your feed.
                </p>

                {error && (
                    <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                        {error}
                    </div>
                )}

                {fetching
                    ? <div className="flex justify-center py-8">
                        <div className="w-6 h-6 border-4 border-gray-200 dark:border-gray-700 border-t-[#9440dd] rounded-full animate-spin" />
                    </div>
                    : <>
                        <InterestsPicker selected={selected} onChange={setSelected} />
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">{selected.length} selected</p>
                    </>
                }

                <div className="flex flex-col gap-3 mt-6">
                    <button
                        onClick={handleContinue}
                        disabled={loading}
                        className="w-full bg-[#9440dd] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-[#7d36c0] transition disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Continue'}
                    </button>
                    <button
                        onClick={handleSkip}
                        className="w-full text-center text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition"
                    >
                        Skip
                    </button>
                </div>

            </div>
        </div>
    );
}