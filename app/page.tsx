'use client';

import { useCallback, useState } from 'react';
import ChatInput from '../components/ChatInput';
import ChatWindow from '../components/ChatWindow';
import type { Message } from '../components/MessageBubble';

const PIPELINE_LABELS = [
  'Analyzing product',
  'Scraping website',
  'Writing creative brief',
  'Sourcing assets',
  'Rendering video',
];

const EXAMPLE_PROMPTS = [
  'Create a UGC video for my new energy drink brand',
  'Make a TikTok-style ad for evolvfit.com',
  'Generate a product review video for a skincare serum',
];

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const isProductVideoRequest = (text: string): boolean => {
    const lower = text.toLowerCase();
    return (
      lower.includes('video') ||
      lower.includes('ugc') ||
      lower.includes('tiktok') ||
      lower.includes('ad') ||
      lower.includes('create') ||
      lower.includes('generate') ||
      lower.includes('make') ||
      lower.includes('.com') ||
      lower.includes('.io') ||
      lower.includes('http')
    );
  };

  const simulateSteps = useCallback(
    (loadingMsgId: string) => {
      let currentStep = 0;

      const advanceStep = () => {
        if (currentStep >= PIPELINE_LABELS.length) return;

        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== loadingMsgId) return m;
            const updatedSteps = PIPELINE_LABELS.map((label, i) => ({
              label,
              status:
                i < currentStep
                  ? ('done' as const)
                  : i === currentStep
                    ? ('active' as const)
                    : ('pending' as const),
            }));
            return { ...m, steps: updatedSteps };
          })
        );

        currentStep++;
        if (currentStep <= PIPELINE_LABELS.length) {
          setTimeout(advanceStep, 800 + Math.random() * 600);
        }
      };

      advanceStep();
    },
    []
  );

  const handleSend = useCallback(
    async (text: string) => {
      const userMsg: Message = {
        id: uid(),
        role: 'user',
        content: text,
      };

      const showPipeline = isProductVideoRequest(text);
      const loadingMsgId = uid();

      const loadingMsg: Message | null = showPipeline
        ? {
            id: loadingMsgId,
            role: 'assistant',
            content: 'Starting your video pipeline…',
            steps: PIPELINE_LABELS.map((label) => ({
              label,
              status: 'pending' as const,
            })),
          }
        : null;

      setMessages((prev) =>
        loadingMsg ? [...prev, userMsg, loadingMsg] : [...prev, userMsg]
      );
      setIsLoading(true);

      if (showPipeline) {
        simulateSteps(loadingMsgId);
      }

      try {
        const conversationHistory = [...messages, userMsg].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            conversation: conversationHistory,
          }),
        });

        const data: { reply: string; videoUrl?: string } = await res.json();

        const assistantMsg: Message = {
          id: uid(),
          role: 'assistant',
          content: data.reply,
          videoUrl: data.videoUrl,
        };

        setMessages((prev) => {
          if (loadingMsg) {
            // Replace the loading message with the real response, marking all steps as done
            return prev.map((m) =>
              m.id === loadingMsgId
                ? {
                    ...assistantMsg,
                    id: loadingMsgId,
                    steps: PIPELINE_LABELS.map((label) => ({
                      label,
                      status: 'done' as const,
                    })),
                  }
                : m
            );
          }
          return [...prev, assistantMsg];
        });
      } catch {
        const errorMsg: Message = {
          id: uid(),
          role: 'assistant',
          content:
            'Sorry, something went wrong connecting to the server. Please try again.',
        };

        setMessages((prev) => {
          if (loadingMsg) {
            return prev.map((m) => (m.id === loadingMsgId ? errorMsg : m));
          }
          return [...prev, errorMsg];
        });
      } finally {
        setIsLoading(false);
      }
    },
    [messages, simulateSteps]
  );

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-dvh flex-col">
      {/* ── Header ─────────────────────────────────── */}
      <header className="glass-strong sticky top-0 z-30 border-b border-white/[0.06]">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          {/* Sparkle icon */}
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600/20">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 0L9.8 6.2L16 8L9.8 9.8L8 16L6.2 9.8L0 8L6.2 6.2L8 0Z"
                fill="#a78bfa"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-100">UGC Studio</h1>
            <p className="text-[11px] text-gray-500">AI Video Generator</p>
          </div>
        </div>
      </header>

      {/* ── Chat or Welcome ────────────────────────── */}
      {isEmpty ? (
        <div className="flex flex-1 flex-col items-center justify-center px-4">
          <div className="mx-auto max-w-md text-center">
            {/* Large sparkle */}
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600/10 ring-1 ring-brand-500/20">
              <svg width="28" height="28" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 0L9.8 6.2L16 8L9.8 9.8L8 16L6.2 9.8L0 8L6.2 6.2L8 0Z"
                  fill="#8b5cf6"
                />
              </svg>
            </div>

            <h2 className="mb-2 text-2xl font-bold tracking-tight text-gray-100">
              Create UGC Videos Instantly
            </h2>
            <p className="mb-8 text-sm leading-relaxed text-gray-400">
              Describe your product or paste a URL, and our AI will generate a
              viral-ready UGC marketing video in seconds.
            </p>

            {/* Example prompts */}
            <div className="flex flex-col gap-2">
              {EXAMPLE_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  disabled={isLoading}
                  className="glass w-full rounded-xl px-4 py-3 text-left text-sm text-gray-300 transition-all hover:bg-white/[0.06] hover:text-gray-100 disabled:opacity-50"
                >
                  <span className="mr-2 text-brand-400">→</span>
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <ChatWindow messages={messages} isLoading={isLoading} />
      )}

      {/* ── Input ──────────────────────────────────── */}
      <div className="sticky bottom-0 z-30 border-t border-white/[0.04] bg-gray-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <ChatInput onSend={handleSend} disabled={isLoading} />
          <p className="mt-2 text-center text-[11px] text-gray-600">
            UGC Studio may generate inaccurate content. Review videos before
            publishing.
          </p>
        </div>
      </div>
    </div>
  );
}
