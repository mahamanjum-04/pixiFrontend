// src/hooks/useWebSocket.js

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth.jsx';

export function useWebSocket(roomId) {
    const [messages, setMessages] = useState([]);
    const [connected, setConnected] = useState(false);
    const wsRef = useRef(null);

    useEffect(() => {
        if (!roomId) return;

        // ✅ STEP 1: Get the JWT token from localStorage
        const token = localStorage.getItem('access_token');

        if (!token) {
            console.error('No access token found! User might not be logged in.');
            return;
        }

        // ✅ STEP 2: Build WebSocket URL with token
        const wsUrl = `ws://localhost:8000/ws/chat/${roomId}/?token=${token}`;

        console.log('Connecting to WebSocket with auth token...');
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('✅ WebSocket connected!');
            setConnected(true);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                // Respond to server ping
                if (data.type === 'ping') {
                    ws.send(JSON.stringify({ type: 'pong' }));
                    return;
                }

                // ✅ STEP 3: Add received message to state
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
                console.error('Error parsing message:', error);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        ws.onclose = () => {
            console.log('WebSocket disconnected');
            setConnected(false);
        };

        // Cleanup on unmount
        return () => {
            ws.close();
        };
    }, [roomId]);

    // ✅ STEP 4: Send message - ONLY the message text!
    const sendMessage = useCallback((text) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            console.warn('WebSocket not connected');
            return false;
        }

        try {
            // ✅ ONLY send message - backend knows who user is from token
            wsRef.current.send(JSON.stringify({
                message: text
            }));
            console.log('📤 Sent:', text);
            return true;
        } catch (error) {
            console.error('Error sending:', error);
            return false;
        }
    }, []);

    return {
        messages,
        setMessages,
        connected,
        sendMessage
    };
}