'use client';

interface VideoCardProps {
  url: string;
}

export default function VideoCard({ url }: VideoCardProps) {
  return (
    <div className="mt-3 w-full max-w-[240px] overflow-hidden rounded-2xl border border-white/[0.08] bg-black/40">
      {/* Video in 9:16 aspect ratio */}
      <div className="relative" style={{ aspectRatio: '9 / 16', maxHeight: '400px' }}>
        <video
          src={url}
          controls
          playsInline
          className="h-full w-full rounded-t-2xl object-cover"
          preload="metadata"
        />
      </div>

      {/* Download bar */}
      <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-3">
        <span className="text-xs font-medium text-gray-400">Generated Video</span>
        <a
          href={url}
          download
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-500"
        >
          {/* Download arrow icon */}
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M7 2v7.5M7 9.5L4 6.5M7 9.5l3-3M3 12h8"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Download
        </a>
      </div>
    </div>
  );
}
