import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import {
    getRequests, sendRequest, acceptRequest, rejectRequest
} from '../services/messaging';

export default function InboxPage() {
    const { user }     = useAuth();
    const navigate     = useNavigate();
    const location     = useLocation();

    const [requests, setRequests] = useState([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState('');
    const [tab, setTab]           = useState('pending');
    const [sending, setSending]   = useState(false);

    const handleSendRequest = useCallback(() => {
        const params     = new URLSearchParams(location.search);
        const receiverId = params.get('request');
        const artworkId  = params.get('artwork');

        if (!receiverId || !artworkId || !user?.is_buyer) return;

        const run = async () => {
            setSending(true);
            try {
                await sendRequest({ receiver: parseInt(receiverId), artwork: parseInt(artworkId) });
            } catch {
                // request may already exist, ignore
            } finally {
                setSending(false);
                navigate('/inbox', { replace: true });
            }
        };

        setTimeout(run, 0);
    }, [location.search, navigate, user?.is_buyer]);

    useEffect(() => {
        handleSendRequest();
    }, [handleSendRequest]);

    useEffect(() => {
        let cancelled = false;

        const fetchInbox = async () => {
            try {
                const res = await getRequests();
                if (!cancelled) setRequests(res.data);
            } catch {
                if (!cancelled) setError('Failed to load inbox.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchInbox();
        return () => { cancelled = true; };
    }, []);

    const handleAccept = async (id) => {
        try {
            const res = await acceptRequest(id);
            setRequests(prev => prev.map(r => r.id === id ? res.data : r));
        } catch { alert('Failed to accept request.'); }
    };

    const handleReject = async (id) => {
        try {
            const res = await rejectRequest(id);
            setRequests(prev => prev.map(r => r.id === id ? res.data : r));
        } catch { alert('Failed to reject request.'); }
    };

    const pending  = requests.filter(r => r.status === 'pending');
    const accepted = requests.filter(r => r.status === 'accepted');
    const rejected = requests.filter(r => r.status === 'rejected');

    const displayed = tab === 'pending' ? pending : tab === 'accepted' ? accepted : rejected;

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
            <Navbar />
            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-20 md:pb-8">

                {/* Back arrow (mobile) */}
                <button
                    onClick={() => navigate(-1)}
                    className="mb-4 md:hidden text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                </button>

                <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Messages</h1>

                {sending && (
                    <div className="mb-4 px-4 py-3 bg-[#9440dd]/10 border border-[#9440dd]/20 rounded-lg text-sm text-[#9440dd]">
                        Sending message request...
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto">
                    {[
                        { key: 'pending',  label: `Pending (${pending.length})`  },
                        { key: 'accepted', label: `Chats (${accepted.length})`   },
                        { key: 'rejected', label: `Declined (${rejected.length})` },
                    ].map(t => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition
                                ${tab === t.key
                                    ? 'bg-[#9440dd] text-white'
                                    : 'bg-gray-100 dark:bg-[#141414] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#1e1e1e]'
                                }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Loading */}
                {loading && (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-gray-200 dark:border-gray-700 border-t-[#9440dd] rounded-full animate-spin" />
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="text-center py-20 text-red-400 text-sm">{error}</div>
                )}

                {/* Empty */}
                {!loading && !error && displayed.length === 0 && (
                    <div className="text-center py-20 text-gray-400 dark:text-gray-500 text-sm">
                        {tab === 'pending'  && 'No pending requests.'}
                        {tab === 'accepted' && 'No active chats yet.'}
                        {tab === 'rejected' && 'No declined requests.'}
                    </div>
                )}

                {/* Request cards */}
                {!loading && !error && displayed.length > 0 && (
                    <div className="flex flex-col gap-3">
                        {displayed.map(r => (
                            <div
                                key={r.id}
                                className="bg-gray-50 dark:bg-[#141414] border border-gray-100 dark:border-gray-800 rounded-xl p-4"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        {/* Avatar */}
                                        <div className="w-10 h-10 rounded-full bg-[#9440dd] flex items-center justify-center text-sm font-semibold text-white flex-shrink-0">
                                            {(user?.is_creator ? r.sender_name : r.receiver_name)?.[0]?.toUpperCase() || 'U'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                                {user?.is_creator ? r.sender_name : r.receiver_name}
                                            </p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                                                re: {r.artwork_title}
                                            </p>
                                            <p className="text-xs text-gray-300 dark:text-gray-600 mt-0.5">
                                                {new Date(r.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 flex-shrink-0">
                                        {tab === 'pending' && user?.is_creator && (
                                            <>
                                                <button
                                                    onClick={() => handleAccept(r.id)}
                                                    className="px-3 py-1.5 bg-[#9440dd] text-white text-xs rounded-lg hover:bg-[#7d36c0] transition"
                                                >
                                                    Accept
                                                </button>
                                                <button
                                                    onClick={() => handleReject(r.id)}
                                                    className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-xs rounded-lg hover:border-red-300 hover:text-red-500 transition"
                                                >
                                                    Decline
                                                </button>
                                            </>
                                        )}

                                        {tab === 'accepted' && (
                                            <button
                                                onClick={() => navigate(`/chat/${r.id}`)}
                                                className="px-3 py-1.5 bg-[#9440dd] text-white text-xs rounded-lg hover:bg-[#7d36c0] transition"
                                            >
                                                Open chat
                                            </button>
                                        )}

                                        {tab === 'pending' && user?.is_buyer && (
                                            <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg">
                                                Awaiting response
                                            </span>
                                        )}

                                        {tab === 'rejected' && (
                                            <span className="text-xs text-gray-400 bg-gray-100 dark:bg-[#0a0a0a] px-3 py-1.5 rounded-lg">
                                                Declined
                                            </span>
                                        )}
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