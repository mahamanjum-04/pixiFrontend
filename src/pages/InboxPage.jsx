import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../hooks/useAuthContext';
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
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-2xl mx-auto px-6 py-8">

                <h1 className="text-2xl font-semibold text-gray-900 mb-6">Inbox</h1>

                {sending && (
                    <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-600">
                        Sending message request...
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    {[
                        { key: 'pending',  label: `Pending (${pending.length})`  },
                        { key: 'accepted', label: `Chats (${accepted.length})`   },
                        { key: 'rejected', label: `Declined (${rejected.length})` },
                    ].map(t => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition
                ${tab === t.key
                                ? 'bg-black text-white border-black'
                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* States */}
                {loading && (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
                    </div>
                )}

                {error && (
                    <div className="text-center py-20 text-red-400 text-sm">{error}</div>
                )}

                {!loading && !error && displayed.length === 0 && (
                    <div className="text-center py-20 text-gray-400 text-sm">
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
                                className="bg-white border border-gray-100 rounded-xl p-4"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                        {/* Who */}
                                        <p className="text-sm font-medium text-gray-900">
                                            {user?.is_creator ? r.sender_name : r.receiver_name}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            re: {r.artwork_title}
                                        </p>
                                        <p className="text-xs text-gray-300 mt-0.5">
                                            {new Date(r.created_at).toLocaleDateString()}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 flex-shrink-0">
                                        {tab === 'pending' && user?.is_creator && (
                                            <>
                                                <button
                                                    onClick={() => handleAccept(r.id)}
                                                    className="px-3 py-1.5 bg-black text-white text-xs rounded-lg hover:bg-gray-800 transition"
                                                >
                                                    Accept
                                                </button>
                                                <button
                                                    onClick={() => handleReject(r.id)}
                                                    className="px-3 py-1.5 border border-gray-200 text-gray-500 text-xs rounded-lg hover:border-red-200 hover:text-red-500 transition"
                                                >
                                                    Decline
                                                </button>
                                            </>
                                        )}

                                        {tab === 'accepted' && (
                                            <button
                                                onClick={() => navigate(`/chat/${r.id}`)}
                                                className="px-3 py-1.5 bg-black text-white text-xs rounded-lg hover:bg-gray-800 transition"
                                            >
                                                Open chat
                                            </button>
                                        )}

                                        {tab === 'pending' && user?.is_buyer && (
                                            <span className="text-xs text-yellow-600 bg-yellow-50 px-3 py-1.5 rounded-lg">
                        Awaiting response
                      </span>
                                        )}

                                        {tab === 'rejected' && (
                                            <span className="text-xs text-red-400 bg-red-50 px-3 py-1.5 rounded-lg">
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