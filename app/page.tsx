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

/** Client-side demo responses when API is unavailable (GitHub Pages). */
function getDemoResponse(
  text: string,
  isProduct: boolean
): { reply: string; videoUrl?: string } {
  const lower = text.toLowerCase();

  if (/^(hi|hello|hey|sup|yo)\b/i.test(lower)) {
    return {
      reply: "Hey! 👋 Send me your product URL and I'll turn it into a short UGC-style marketing video. 🎬",
    };
  }

  if (/(what can you do|help|how does this work)/i.test(lower)) {
    return {
      reply: 'I can create short UGC-style marketing videos for your product! Just send me a product description or website URL, and I\'ll analyze it, pick visuals, GIFs, and audio, then generate a trendy short video.\n\nTry something like: "I\'m building CalAI, a calorie tracking app. Here\'s the site: calai.app"',
    };
  }

  if (isProduct) {
    // Extract a product name from the message for a realistic demo
    const nameMatch = text.match(
      /(?:building|made|built|called|named)\s+(?:an?\s+)?([A-Z][a-zA-Z0-9]+)/i
    );
    const urlMatch = text.match(
      /([a-zA-Z0-9][-a-zA-Z0-9]*\.(com|app|io|co|ai|dev))/i
    );
    const name =
      nameMatch?.[1] ||
      (urlMatch ? urlMatch[1].split('.')[0].charAt(0).toUpperCase() + urlMatch[1].split('.')[0].slice(1) : 'Your Product');

    return {
      reply: `Here's your UGC video for ${name}! 🎬🔥\n\n**Creative Brief:**\n• Hook: "POV: you just found ${name} and your life changed"\n• Caption: "${name} is literally the future no cap"\n• Tone: Excited, trendy, Gen Z energy\n\n⚠️ *This is a demo on GitHub Pages. Run the app locally with API keys to generate real videos with FFmpeg.*`,
      videoUrl: 'https://placeholdervideo.dev/1080x1920',
    };
  }

  return {
    reply: "I'm not sure what you mean. Try sending me a product URL or description and I'll create a UGC-style marketing video for you!",
  };
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
        let data: { reply: string; videoUrl?: string };

        try {
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text }),
          });

          if (!res.ok) throw new Error('API unavailable');
          data = await res.json();
        } catch {
          // Demo mode fallback (GitHub Pages / no backend)
          data = getDemoResponse(text, showPipeline);
          if (showPipeline) {
            // Simulate pipeline delay in demo mode
            await new Promise((r) => setTimeout(r, 4000));
          }
        }

        const assistantMsg: Message = {
          id: uid(),
          role: 'assistant',
          content: data.reply,
          videoUrl: data.videoUrl,
        };

        setMessages((prev) => {
          if (loadingMsg) {
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
            'Sorry, something went wrong. Please try again.',
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
