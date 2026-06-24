'use client';

import StatusSteps, { type Step } from './StatusSteps';
import VideoCard from './VideoCard';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  videoUrl?: string;
  steps?: Step[];
}

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={`animate-fade-in-up flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`relative max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-gradient-to-br from-brand-600 to-brand-700 text-white'
            : 'glass border border-white/[0.06] text-gray-200'
        }`}
      >
        {/* Avatar indicator */}
        {!isUser && (
          <div className="mb-1.5 flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500/20">
              {/* Sparkle mini icon */}
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path
                  d="M5 0L6.1 3.9L10 5L6.1 6.1L5 10L3.9 6.1L0 5L3.9 3.9L5 0Z"
                  fill="#a78bfa"
                />
              </svg>
            </div>
            <span className="text-[11px] font-medium tracking-wide text-brand-400 uppercase">
              UGC Studio
            </span>
          </div>
        )}

        {/* Message text */}
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>

        {/* Pipeline steps */}
        {message.steps && message.steps.length > 0 && (
          <StatusSteps steps={message.steps} />
        )}

        {/* Video card */}
        {message.videoUrl && <VideoCard url={message.videoUrl} />}
      </div>
    </div>
  );
}
