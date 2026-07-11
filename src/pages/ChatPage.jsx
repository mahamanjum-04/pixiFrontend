// src/pages/ChatPage.jsx

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx'; 
import { useWebSocket } from '../hooks/useWebSocket';
import { getChatHistory, sendMessage as sendRestMessage } from '../services/messaging';

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

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex flex-col">
            {/* Header */}
            <div className="border-b border-gray-200 dark:border-gray-800 px-4 py-3">
                <div className="max-w-2xl mx-auto flex items-center gap-3">
                    <button
                        onClick={() => navigate('/inbox')}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ← Back
                    </button>
                    <span className="font-medium">Chat #{roomId}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                        connected ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                        {connected ? '🟢 Online' : '🟡 Connecting...'}
                    </span>
                </div>
            </div>

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