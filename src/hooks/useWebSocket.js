// src/hooks/useWebSocket.js

import { useState, useEffect, useRef, useCallback } from 'react';

// ── Helper: build the WebSocket URL ────────────────────────────────
function getWebSocketURL(roomId, token) {
    // 1. If you set VITE_WS_URL explicitly (recommended for production)
    if (import.meta.env.VITE_WS_URL) {
        return `${import.meta.env.VITE_WS_URL}/ws/chat/${roomId}/?token=${token}`;
    }

    // 2. Derive from VITE_API_URL (if set)
    if (import.meta.env.VITE_API_URL) {
        // Convert http://... → ws://... and https://... → wss://...
        const wsBase = import.meta.env.VITE_API_URL
            .replace(/^http/, 'ws')
            .replace(/\/api\/?$/, ''); // remove trailing /api if present
        return `${wsBase}/ws/chat/${roomId}/?token=${token}`;
    }

    // 3. Fallback: use the current host (works both locally and on Render/Vercel)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;

    // If we are on localhost, force backend port 8000 (common Django dev port)
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
        return `ws://localhost:8000/ws/chat/${roomId}/?token=${token}`;
    }

    // Production: use the same host as the frontend, but with ws/wss.
    // This works if frontend and backend are on the same domain (not your case).
    // For Vercel+Render, you MUST set VITE_WS_URL or VITE_API_URL.
    return `${protocol}//${host}/ws/chat/${roomId}/?token=${token}`;
}

export function useWebSocket(roomId) {
    const [messages, setMessages] = useState([]);
    const [connected, setConnected] = useState(false);
    const wsRef = useRef(null);
    const reconnectTimerRef = useRef(null);

    useEffect(() => {
        if (!roomId) return;

        // ✅ Get token from localStorage
        const token = localStorage.getItem('access_token');
        if (!token) {
            console.error('❌ No access token found. User must be logged in.');
            return;
        }

        // ✅ Build the correct URL
        const wsUrl = getWebSocketURL(roomId, token);
        console.log('🔄 Connecting to WebSocket:', wsUrl);

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('✅ WebSocket connected!');
            setConnected(true);
            // Clear any reconnect timer on successful connect
            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current);
                reconnectTimerRef.current = null;
            }
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                // Respond to server ping
                if (data.type === 'ping') {
                    ws.send(JSON.stringify({ type: 'pong' }));
                    return;
                }

                // Add message to state
                if (data.message) {
                    console.log('📩 Received:', data);
                    setMessages(prev => [...prev, {
                        message: data.message,
                        user_id: data.user_id,
                        sender_name: data.sender_name,
                        timestamp: data.timestamp,
                    }]);
                }
            } catch (error) {
                console.error('❌ Error parsing message:', error);
            }
        };

        ws.onerror = (error) => {
            console.error('❌ WebSocket error:', error);
        };

        ws.onclose = (event) => {
            console.log('🔌 WebSocket disconnected (code:', event.code, ')');
            setConnected(false);

            // Attempt to reconnect after 3 seconds if not closed intentionally
            if (event.code !== 1000) {
                if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
                reconnectTimerRef.current = setTimeout(() => {
                    console.log('🔄 Attempting to reconnect...');
                    // Re-run the effect by triggering a reconnection?
                    // Since we can't re-run the effect easily, we close and open again.
                    // Simple approach: close and let the effect re-run?
                    // But effect won't re-run because roomId hasn't changed.
                    // So we manually create a new connection.
                    const newWs = new WebSocket(getWebSocketURL(roomId, token));
                    newWs.onopen = ws.onopen;
                    newWs.onmessage = ws.onmessage;
                    newWs.onerror = ws.onerror;
                    newWs.onclose = ws.onclose;
                    wsRef.current = newWs;
                }, 3000);
            }
        };

        // Cleanup on unmount
        return () => {
            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current);
            }
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.close(1000, 'Component unmounting');
            }
        };
    }, [roomId]); // note: token is not in dependencies because we read from localStorage each time

    // ✅ Send message – ONLY the message text
    const sendMessage = useCallback((text) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            console.warn('⚠️ WebSocket not connected');
            return false;
        }

        try {
            wsRef.current.send(JSON.stringify({ message: text }));
            console.log('📤 Sent:', text);
            return true;
        } catch (error) {
            console.error('❌ Error sending:', error);
            return false;
        }
    }, []);

    return {
        messages,
        setMessages,
        connected,
        sendMessage,
    };
}