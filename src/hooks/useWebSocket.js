import { useState, useEffect, useRef, useCallback } from 'react';

export function useWebSocket(roomId) {
    const [messages, setMessages]   = useState([]);
    const [connected, setConnected] = useState(false);
    const wsRef                     = useRef(null);

    useEffect(() => {
        if (!roomId) return;

        const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8000'}/ws/chat/${roomId}/`;
        const ws    = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => setConnected(true);

        ws.onmessage = (e) => {
            const data = JSON.parse(e.data);
            setMessages(prev => [...prev, data]);
        };

        ws.onerror = (e) => console.error('WebSocket error:', e);

        ws.onclose = () => setConnected(false);

        return () => ws.close();
    }, [roomId]);

    const sendMessage = useCallback((text, userId) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ message: text, user_id: userId }));
        }
    }, []);

    return { messages, setMessages, connected, sendMessage };
}