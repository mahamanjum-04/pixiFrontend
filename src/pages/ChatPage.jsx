import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import { useAuth } from '../hooks/useAuthContext.jsx';
import { useWebSocket } from '../hooks/useWebSocket.js';
import { getChatHistory } from '../services/messaging.js';
import { submitReport } from '../services/admin.js';

export default function ChatPage() {
    const { roomId }   = useParams();
    const { user }     = useAuth();
    const navigate     = useNavigate();
    const bottomRef    = useRef(null);

    const [input, setInput]           = useState('');
    const [loading, setLoading]       = useState(true);
    const [showReport, setShowReport] = useState(false);
    const [reportReason, setReportReason]   = useState('inappropriate');
    const [reportDesc, setReportDesc]       = useState('');
    const [reportLoading, setReportLoading] = useState(false);
    const [reportSuccess, setReportSuccess] = useState('');
    const [reportError, setReportError]     = useState('');

    const { messages, setMessages, connected, sendMessage } = useWebSocket(roomId);

    useEffect(() => {
        let cancelled = false;

        const fetchHistory = async () => {
            try {
                const res = await getChatHistory(roomId);
                if (!cancelled) {
                    const history = res.data.map(m => ({
                        message:     m.content,
                        user_id:     m.sender,
                        sender_name: m.sender_name,
                        timestamp:   m.timestamp,
                    }));
                    setMessages(history);
                }
            } catch {
                // history load failed silently
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchHistory();
        return () => { cancelled = true; };
    }, [roomId, setMessages]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        const text = input.trim();
        if (!text || !connected) return;
        sendMessage(text, user.id, user.username);
        setInput('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleReport = async () => {
        setReportLoading(true);
        setReportError('');
        setReportSuccess('');
        try {
            await submitReport({
                reported_artwork: null,
                reported_user:    null,
                reason:           reportReason,
                description:      reportDesc || `Reported from chat room ${roomId}`,
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

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex flex-col">
            <Navbar />

            <div
                className="max-w-2xl w-full mx-auto px-4 flex flex-col flex-1 pt-4 pb-20 md:pb-4"
                style={{ height: 'calc(100vh - 57px)' }}
            >

                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <button
                        onClick={() => navigate('/inbox')}
                        className="text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </button>

                    <div className="w-8 h-8 rounded-full bg-[#9440dd] flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
                        {user?.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Chat #{roomId}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                        connected ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-gray-100 dark:bg-[#141414] text-gray-400'
                    }`}>
                        {connected ? 'Connected' : 'Connecting...'}
                    </span>

                    {/* Report button */}
                    <button
                        onClick={() => setShowReport(r => !r)}
                        className="ml-auto text-xs text-gray-300 dark:text-gray-600 hover:text-red-400 transition"
                    >
                        ⚑ Report
                    </button>
                </div>

                {/* Report panel */}
                {showReport && (
                    <div className="bg-gray-50 dark:bg-[#141414] border border-gray-100 dark:border-gray-800 rounded-xl p-4 mb-4">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">Report this conversation</p>

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

                {/* Messages */}
                <div className="flex-1 overflow-y-auto flex flex-col gap-2 pb-2">

                    {loading && (
                        <div className="flex justify-center py-10">
                            <div className="w-6 h-6 border-4 border-gray-200 dark:border-gray-700 border-t-[#9440dd] rounded-full animate-spin" />
                        </div>
                    )}

                    {!loading && messages.length === 0 && (
                        <div className="text-center py-10 text-gray-300 dark:text-gray-600 text-sm">
                            No messages yet. Say hello!
                        </div>
                    )}

                    {messages.map((msg, i) => {
                        const isMe = msg.user_id === user?.id;
                        return (
                            <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                {!isMe && (
                                    <span className="text-xs text-gray-400 dark:text-gray-500 mb-1 ml-1">{msg.sender_name}</span>
                                )}
                                <div className={`max-w-xs px-4 py-2.5 text-sm leading-relaxed ${
                                    isMe
                                        ? 'bg-[#9440dd] text-white rounded-2xl rounded-tr-sm'
                                        : 'bg-[#141414] dark:bg-[#1e1e1e] text-white rounded-2xl rounded-tl-sm'
                                }`}>
                                    {msg.message}
                                </div>
                                <span className="text-[10px] text-gray-300 dark:text-gray-600 mt-1 mx-1">
                                    {msg.timestamp
                                        ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                        : 'Just now'}
                                </span>
                            </div>
                        );
                    })}

                    <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="mt-2 flex gap-2 items-end bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-gray-700 rounded-full px-4 py-2">
                    <textarea
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={connected ? 'Type a message...' : 'Connecting...'}
                        disabled={!connected}
                        rows={1}
                        className="flex-1 text-sm text-gray-800 dark:text-gray-100 resize-none focus:outline-none bg-transparent py-1.5 placeholder-gray-300 dark:placeholder-gray-600 disabled:opacity-50"
                        style={{ maxHeight: '120px' }}
                        onInput={e => {
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || !connected}
                        className="mb-1 w-8 h-8 flex-shrink-0 bg-[#9440dd] text-white rounded-full flex items-center justify-center hover:bg-[#7d36c0] transition disabled:opacity-30"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                        </svg>
                    </button>
                </div>

            </div>
        </div>
    );
}