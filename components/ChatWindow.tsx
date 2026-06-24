'use client';

import { useEffect, useRef } from 'react';
import MessageBubble, { type Message } from './MessageBubble';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
}

export default function ChatWindow({ messages, isLoading }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const showTypingIndicator =
    isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user';

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Typing indicator */}
        {showTypingIndicator && (
          <div className="animate-fade-in-up flex justify-start">
            <div className="glass flex items-center gap-1.5 rounded-2xl border border-white/[0.06] px-5 py-3.5">
              <span className="block h-2 w-2 animate-pulse-dot rounded-full bg-brand-400" />
              <span
                className="block h-2 w-2 animate-pulse-dot rounded-full bg-brand-400"
                style={{ animationDelay: '0.2s' }}
              />
              <span
                className="block h-2 w-2 animate-pulse-dot rounded-full bg-brand-400"
                style={{ animationDelay: '0.4s' }}
              />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
