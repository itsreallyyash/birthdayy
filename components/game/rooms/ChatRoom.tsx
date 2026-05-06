'use client';

import { useEffect, useState, useRef } from 'react';
import { Message } from '@/lib/types';
import { supabase } from '@/lib/supabase';

export function ChatRoom() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) throw error;

        setMessages(data || []);
      } catch (error) {
        console.error('[v0] Failed to fetch messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-primary" style={{ fontFamily: "'Press Start 2P', cursive" }}>
          LOADING CONVERSATIONS...
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 h-full flex flex-col bg-gradient-to-br from-yellow-50 to-yellow-100 relative">
      {/* Decorative elements */}
      <div className="absolute top-4 right-4 text-4xl opacity-20">💙</div>
      <div className="absolute bottom-4 left-4 text-5xl opacity-15">🌸</div>
      
      <div style={{ fontFamily: "'Press Start 2P', cursive" }} className="text-primary mb-4 text-center text-sm">
        💬 INITIAL CHATS
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-2 mb-2"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center text-muted text-xs">
            <div className="p-4">
              <div style={{ fontFamily: "'Press Start 2P', cursive" }} className="text-muted mb-2">NO MESSAGES</div>
              <p>Upload conversations from the admin panel</p>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={msg.id}
              className="bg-white border-l-4 p-3 rounded animate-in fade-in duration-300"
              style={{
                borderLeftColor: msg.avatar_color,
                animation: `slideIn 0.3s ease-out ${idx * 50}ms both`,
              }}
            >
              <div
                style={{ fontFamily: "'Press Start 2P', cursive", color: msg.avatar_color }}
                className="text-xs mb-1"
              >
                {msg.speaker}
              </div>
              <p className="text-xs text-foreground leading-relaxed break-words">
                {msg.content}
              </p>
              {msg.timestamp && (
                <div className="text-xs text-muted mt-2 opacity-75">
                  {msg.timestamp}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Message count indicator */}
      {messages.length > 0 && (
        <div style={{ fontFamily: "'Press Start 2P', cursive" }} className="text-xs text-muted text-center border-t border-gray-300 pt-2">
          {messages.length} MESSAGES
        </div>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
