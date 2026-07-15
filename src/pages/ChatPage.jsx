// src/pages/ChatPage.jsx

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx'; 
import { useWebSocket } from '../hooks/useWebSocket';
import { getChatHistory, sendMessage as sendRestMessage } from '../services/messaging';
import { getRequestDetail } from '../services/messaging';
import { submitReport } from '../services/admin.js';

export default function ChatPage() {
    const { roomId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const bottomRef = useRef(null);

    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);

    // ✅ Use the WebSocket hook
    const { messages, setMessages, connected, sendMessage } = useWebSocket(roomId);

    // Load chat history
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await getChatHistory(roomId);
                const history = res.data.map(m => ({
                    message: m.content,
                    user_id: m.sender,
                    sender_name: m.sender_name,
                    timestamp: m.timestamp,
                }));
                setMessages(history);
            } catch (error) {
                console.error('Failed to load history:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [roomId, setMessages]);

    // Auto-scroll to bottom
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ✅ STEP 1: Handle sending message
    const handleSend = async () => {
        const text = input.trim();
        if (!text) return;

        // ✅ STEP 2: Try WebSocket first
        if (connected) {
            const sent = sendMessage(text);
            if (sent) {
                setInput('');  // Clear input
                return;        // Message will appear via WebSocket
            }
        }

        // ✅ STEP 3: Fallback to REST API
        try {
            await sendRestMessage(roomId, text);

            // ✅ STEP 4: Optimistically add message (only for REST fallback)
            const optimisticMsg = {
                message: text,
                user_id: user.id,
                sender_name: user.username,
                timestamp: new Date().toISOString(),
            };
            setMessages(prev => [...prev, optimisticMsg]);
            setInput('');
        } catch (error) {
            console.error('Failed to send:', error);
            alert('Failed to send message. Please try again.');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const [otherUser, setOtherUser] = useState(null);
    const [showReport, setShowReport] = useState(false);
    const [reportReason, setReportReason] = useState('harassment');
    const [reportDesc, setReportDesc] = useState('');
    const [reportLoading, setReportLoading] = useState(false);
    const [reportSuccess, setReportSuccess] = useState('');
    const [reportError, setReportError] = useState('');

    useEffect(() => {
        getRequestDetail(roomId)
            .then(res => {
                const data = res.data;
                const other = data.sender === user.id
                    ? { id: data.receiver, username: data.receiver_name }
                    : { id: data.sender, username: data.sender_name };
                setOtherUser(other);
            })
            .catch(() => {});
    }, [roomId, user]);

    const REASONS = ['inappropriate', 'spam', 'harassment', 'fake', 'other'];

    const handleReport = async () => {
        if (!otherUser) return;
        setReportLoading(true);
        setReportError('');
        try {
            await submitReport({
                reported_artwork: null,
                reported_user: otherUser.id,
                reason: reportReason,
                description: reportDesc || `Reported from chat #${roomId} with ${otherUser.username}`,
            });
            setReportSuccess('Report submitted. Our team will review it shortly.');
            setReportDesc('');
            setTimeout(() => {
                setShowReport(false);
                setReportSuccess('');
            }, 2000);
        } catch {
            setReportError('Failed to submit report. Please try again.');
        } finally {
            setReportLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex flex-col">
            {/* Header */}
            <div className="border-b border-gray-200 dark:border-gray-800 px-4 py-3">
                <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate('/inbox')} className="text-gray-500 hover:text-gray-700">
                            ← Back
                        </button>
                        <span className="font-medium">{otherUser ? otherUser.username : `Chat #${roomId}`}</span>
                    </div>
                    {otherUser && (
                        <button
                            onClick={() => setShowReport(true)}
                            className="text-xs border border-red-200 px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-50 transition"
                        >
                            ⚑ Report
                        </button>
                    )}
                </div>
            </div>

            {/* report */}
            {showReport && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
                    <div className="bg-white dark:bg-[#141414] rounded-xl p-5 w-full max-w-sm">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">
                            Report {otherUser?.username}
                        </p>

                        {reportSuccess && (
                            <p className="text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg mb-3">{reportSuccess}</p>
                        )}
                        {reportError && (
                            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg mb-3">{reportError}</p>
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
                                            : 'bg-white dark:bg-[#0a0a0a] text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700'}`}
                                    >
                                        {r.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <textarea
                            value={reportDesc}
                            onChange={e => setReportDesc(e.target.value)}
                            placeholder="Additional details (optional)..."
                            rows={3}
                            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#0a0a0a] resize-none mb-3"
                        />

                        <div className="flex gap-2">
                            <button
                                onClick={handleReport}
                                disabled={reportLoading}
                                className="flex-1 bg-red-500 text-white py-2 rounded-lg text-xs font-medium hover:bg-red-600 transition disabled:opacity-50"
                            >
                                {reportLoading ? 'Submitting...' : 'Submit report'}
                            </button>
                            <button
                                onClick={() => { setShowReport(false); setReportError(''); }}
                                className="flex-1 border border-gray-200 dark:border-gray-700 py-2 rounded-lg text-xs text-gray-500"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="max-w-2xl mx-auto space-y-3">
                    {loading ? (
                        <div className="text-center text-gray-400">Loading...</div>
                    ) : messages.length === 0 ? (
                        <div className="text-center text-gray-400">No messages yet. Say hello! 👋</div>
                    ) : (
                        messages.map((msg, index) => {
                            const isMe = msg.user_id === user?.id;
                            return (
                                <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className="max-w-[70%]">
                                        {!isMe && (
                                            <div className="text-xs text-gray-500 mb-1 ml-2">
                                                {msg.sender_name}
                                            </div>
                                        )}
                                        <div className={`px-4 py-2 rounded-2xl ${
                                            isMe 
                                                ? 'bg-purple-600 text-white rounded-tr-sm' 
                                                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-tl-sm'
                                        }`}>
                                            {msg.message}
                                        </div>
                                        <div className={`text-xs text-gray-400 mt-1 ${isMe ? 'text-right mr-2' : 'ml-2'}`}>
                                            {new Date(msg.timestamp).toLocaleTimeString()}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={bottomRef} />
                </div>
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 dark:border-gray-800 px-4 py-3">
                <div className="max-w-2xl mx-auto flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={connected ? "Type a message..." : "Connecting..."}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        disabled={!connected}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || !connected}
                        className="px-6 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}