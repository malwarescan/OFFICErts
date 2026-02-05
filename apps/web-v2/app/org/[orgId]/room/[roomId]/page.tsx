'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api, Message } from '@/lib/api';
import { ws } from '@/lib/ws';

export default function RoomPage() {
  const params = useParams();
  const orgId = params.orgId as string;
  const roomId = params.roomId as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize auth token (for demo, create a dev token)
  useEffect(() => {
    const devToken = localStorage.getItem('devToken');
    if (devToken) {
      initializeClient(devToken);
    } else {
      // Create a simple dev token for testing
      const token = `dev_${btoa(JSON.stringify({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        orgId: orgId,
        email: 'test@example.com',
        name: 'Test User'
      }))}`;
      localStorage.setItem('devToken', token);
      initializeClient(token);
    }
  }, [orgId]);

  const initializeClient = async (token: string) => {
    api.setToken(token);
    
    try {
      await ws.connect(token);
      setIsConnected(true);
      ws.subscribeToRoom(roomId);
      
      // Load initial messages
      const result = await api.getMessages(roomId);
      setMessages(result.messages);
      setLoading(false);
    } catch (error) {
      console.error('Failed to initialize:', error);
      setLoading(false);
    }
  };

  // WebSocket event handlers
  useEffect(() => {
    const handleMessage = (data: any) => {
      if (data.type === 'ROOM_MESSAGE_CREATED' && data.payload.message.roomId === roomId) {
        setMessages(prev => [...prev, data.payload.message]);
      }
    };

    ws.on('message', handleMessage);
    return () => ws.off('message', handleMessage);
  }, [roomId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await api.createMessage(roomId, newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading room...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b p-4">
        <h1 className="text-xl font-semibold">Room {roomId}</h1>
        <div className="text-sm text-gray-600">
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
              {message.user?.name?.[0] || '?'}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium">{message.user?.name || 'Unknown'}</span>
                <span className="text-xs text-gray-500">
                  {new Date(message.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <div className="text-gray-900">{message.body}</div>
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No messages yet. Start the conversation!
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="border-t p-4">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!isConnected}
          />
          <button
            type="submit"
            disabled={!isConnected || !newMessage.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
