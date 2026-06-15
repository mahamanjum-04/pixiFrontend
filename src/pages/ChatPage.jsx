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

    // Load chat history
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
                // history load failed silently — chat still works
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchHistory();
        return () => { cancelled = true; };
    }, [roomId, setMessages]);

    // Auto-scroll on new message
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        const text = input.trim();
        if (!text || !connected) return;
        sendMessage(text, user.id);
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
                reported_user:    null, // we don't have the other user's ID here easily
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
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />

            <div
                className="max-w-2xl w-full mx-auto px-4 flex flex-col flex-1 py-4"
                style={{ height: 'calc(100vh - 57px)' }}
            >

                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <button
                        onClick={() => navigate('/inbox')}
                        className="text-gray-400 hover:text-black transition text-sm"
                    >
                        ← Back
                    </button>
                    <span className="text-sm font-medium text-gray-700">Chat #{roomId}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                        connected ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'
                    }`}>
            {connected ? 'Connected' : 'Connecting...'}
          </span>

                    {/* Report button */}
                    <button
                        onClick={() => setShowReport(r => !r)}
                        className="ml-auto text-xs text-gray-300 hover:text-red-400 transition"
                    >
                        ⚑ Report
                    </button>
                </div>

                {/* Report panel */}
                {showReport && (
                    <div className="bg-white border border-gray-100 rounded-xl p-4 mb-4">
                        <p className="text-sm font-medium text-gray-800 mb-3">Report this conversation</p>

                        {reportSuccess && (
                            <p className="text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg mb-3">
                                {reportSuccess}
                            </p>
                        )}
                        {reportError && (
                            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg mb-3">
                                {reportError}
                            </p>
                        )}

                        {/* Reason selector */}
                        <div className="mb-3">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Reason</label>
                            <div className="flex flex-wrap gap-2">
                                {REASONS.map(r => (
                                    <button
                                        key={r}
                                        onClick={() => setReportReason(r)}
                                        className={`px-3 py-1 rounded-full text-xs border transition capitalize
                      ${reportReason === r
                                            ? 'bg-black text-white border-black'
                                            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="mb-3">
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                                Additional details (optional)
                            </label>
                            <textarea
                                value={reportDesc}
                                onChange={e => setReportDesc(e.target.value)}
                                placeholder="Describe the issue..."
                                rows={2}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none"
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
                                className="flex-1 border border-gray-200 py-2 rounded-lg text-xs text-gray-500 hover:border-gray-400 transition"
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
                            <div className="w-6 h-6 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
                        </div>
                    )}

                    {!loading && messages.length === 0 && (
                        <div className="text-center py-10 text-gray-300 text-sm">
                            No messages yet. Say hello!
                        </div>
                    )}

                    {messages.map((msg, i) => {
                        const isMe = msg.user_id === user?.id;
                        return (
                            <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                {!isMe && (
                                    <span className="text-xs text-gray-400 mb-1 ml-1">{msg.sender_name}</span>
                                )}
                                <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                    isMe
                                        ? 'bg-black text-white rounded-br-sm'
                                        : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm'
                                }`}>
                                    {msg.message}
                                </div>
                                <span className="text-[10px] text-gray-300 mt-1 mx-1">
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
                <div className="mt-2 flex gap-2 items-end bg-white border border-gray-200 rounded-2xl px-4 py-2">
          <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={connected ? 'Type a message...' : 'Connecting...'}
              disabled={!connected}
              rows={1}
              className="flex-1 text-sm text-gray-800 resize-none focus:outline-none bg-transparent py-1.5 placeholder-gray-300 disabled:opacity-50"
              style={{ maxHeight: '120px' }}
              onInput={e => {
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
              }}
          />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || !connected}
                        className="mb-1 w-8 h-8 flex-shrink-0 bg-black text-white rounded-xl flex items-center justify-center hover:bg-gray-800 transition disabled:opacity-30"
                    >
                        ↑
                    </button>
                </div>

            </div>
        </div>
    );
}