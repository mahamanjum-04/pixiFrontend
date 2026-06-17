import { useState, useEffect, useRef, useCallback } from 'react';

const getWsURL = (roomId) => {
    if (import.meta.env.VITE_WS_URL) return `${import.meta.env.VITE_WS_URL}/ws/chat/${roomId}/`;
    // Fall back to VITE_API_URL (converting http→ws, https→wss, strip /api suffix)
    if (import.meta.env.VITE_API_URL) {
        const wsBase = import.meta.env.VITE_API_URL
            .replace(/^http/, 'ws')
            .replace(/\/api\/?$/, '');
        return `${wsBase}/ws/chat/${roomId}/`;
    }
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    if (host.includes('localhost') || host.includes('127.0.0.1')) return `ws://localhost:8000/ws/chat/${roomId}/`;
    return `${protocol}//${host}/ws/chat/${roomId}/`;
};

export function useWebSocket(roomId) {
    const [messages, setMessages]   = useState([]);
    const [connected, setConnected] = useState(false);
    const wsRef                     = useRef(null);

    useEffect(() => {
        if (!roomId) return;
        const ws = new WebSocket(getWsURL(roomId));
        wsRef.current = ws;
        ws.onopen    = () => setConnected(true);
        ws.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);

                // Respond to server keep-alive pings
                if (data.type === 'ping') {
                    ws.send(JSON.stringify({ type: 'pong' }));
                    return;
                }

                setMessages(prev => [...prev, data]);
            } catch {
                // Non-JSON message from server — safe to ignore
            }
        };
        ws.onerror = (e) => console.error('WebSocket error:', e);
        ws.onclose = () => setConnected(false);
        return () => ws.close();
    }, [roomId]);

    const sendMessage = useCallback((text, userId, senderName) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            const msg = {
                message:     text,
                user_id:     userId,
                sender_name: senderName || '',
                timestamp:   new Date().toISOString(),
            };
            wsRef.current.send(JSON.stringify({ message: text, user_id: userId }));
            setMessages(prev => [...prev, msg]);
        }
    }, []);

    return { messages, setMessages, connected, sendMessage };
}