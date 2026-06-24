# UGC Studio — AI-Powered UGC Video Generator

A ChatGPT-style web app that creates short UGC (User Generated Content) marketing videos from product descriptions and URLs. Built as a Founding Engineer take-home assignment.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?style=flat-square&logo=tailwindcss)

## What it does

Send a message like *"I'm building CalAI, a calorie-tracking app. Here's the site: calai.app"* and the app will:

1. **Understand your product** — Parse the message for product name, URL, and description
2. **Scrape the website** — Extract homepage content, meta tags, and headings
3. **Generate a creative brief** — Use AI to craft a TikTok-style ad concept with hook text, GIF ideas, and background queries
4. **Source assets** — Fetch stock video/photos (Pexels), reaction GIFs (Giphy), and select audio
5. **Compose the video** — Use FFmpeg to render a 9:16 vertical video with text overlays, GIF, and audio
6. **Return the result** — Display the video directly in the chat interface

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                    Chat UI (React)                    │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ ChatInput│→ │ ChatWindow   │→ │ VideoCard     │  │
│  └──────────┘  └──────────────┘  └───────────────┘  │
└───────────────────────┬──────────────────────────────┘
                        │ POST /api/chat
                        ▼
┌──────────────────────────────────────────────────────┐
│                 API Route Handler                     │
│                                                      │
│  1. detectIntent()        ← lib/intent.ts            │
│  2. extractProduct()      ← lib/extractProduct.ts    │
│  3. scrapeWebsite()       ← lib/scrapeWebsite.ts     │
│  4. summarizeProduct()    ← lib/summarizeProduct.ts  │
│  5. generateCreativeBrief() ← lib/creativeBrief.ts   │
│  6. searchAssets()        ← lib/assetSearch.ts       │
│  7. composeUGCVideo()     ← lib/ffmpeg.ts            │
│                                                      │
└──────────────────────────────────────────────────────┘
```

## Pipeline Flow

```
User Message
    │
    ├─→ Intent Detection (rule-based)
    │     ├─ greeting → friendly response
    │     ├─ capability_question → explain features
    │     ├─ fallback_chat → helpful redirect
    │     └─ product_video_request → trigger pipeline ↓
    │
    ├─→ Extract Product Info (regex + NLP)
    │     └─ { name, url, description }
    │
    ├─→ Scrape Website (cheerio)
    │     └─ { title, description, headings, bodyText }
    │
    ├─→ Summarize Product (OpenAI GPT-4o-mini)
    │     └─ "CalAI is a calorie tracking app that..."
    │
    ├─→ Generate Creative Brief (OpenAI GPT-4o-mini)
    │     └─ { hook, caption, gifQuery, backgroundQuery, audioMood, ... }
    │
    ├─→ Source Assets (parallel)
    │     ├─ Background → Pexels API (video or image)
    │     ├─ GIF → Giphy API
    │     └─ Audio → local tracks mapped by mood
    │
    └─→ Compose Video (FFmpeg)
          └─ 1080x1920 MP4 with overlays → /public/outputs/
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| AI | OpenAI GPT-4o-mini |
| Scraping | Cheerio |
| Video | FFmpeg (raw CLI) |
| Background Media | Pexels API |
| GIF | Giphy API |
| Audio | Local royalty-free tracks |

## Setup

### Prerequisites

- **Node.js** 18+ 
- **FFmpeg** installed and available in PATH
- API keys for OpenAI, Pexels, and Giphy

### Install FFmpeg

**macOS:**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt update && sudo apt install ffmpeg
```

**Windows:**
```bash
# Using Chocolatey
choco install ffmpeg

# Or download from https://ffmpeg.org/download.html
# Add to PATH after download
```

Verify installation:
```bash
ffmpeg -version
```

### Install Dependencies

```bash
cd ugc-chat-app
npm install
```

### Configure Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your API keys:

```env
OPENAI_API_KEY=sk-your-key-here
PEXELS_API_KEY=your-pexels-key
GIPHY_API_KEY=your-giphy-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Getting API keys:**
- **OpenAI**: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- **Pexels**: [pexels.com/api](https://www.pexels.com/api/) (free)
- **Giphy**: [developers.giphy.com](https://developers.giphy.com/) (free)

### Add Audio Tracks

Place 3 royalty-free MP3 files in `public/audio/`:
- `trendy-1.mp3` — upbeat / chill
- `trendy-2.mp3` — funny / quirky  
- `trendy-3.mp3` — dramatic / hype

Or generate placeholder audio (requires FFmpeg):
```bash
node scripts/generate-audio.mjs
```

Free audio sources:
- [Pixabay Music](https://pixabay.com/music/)
- [Freesound](https://freesound.org/)
- [YouTube Audio Library](https://studio.youtube.com/channel/UC/music)

### Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Usage

1. Open the app in your browser
2. Type a message like:
   - `"hi"` → get a friendly greeting
   - `"what can you do?"` → learn about capabilities
   - `"I'm building CalAI, a calorie tracking app. Here's the site: calai.app"` → generate a UGC video
3. Watch the progress steps as the video is generated
4. View and download the final video in the chat

## Project Structure

```
ugc-chat-app/
├── app/
│   ├── layout.tsx              # Root layout with metadata
│   ├── page.tsx                # Main chat page (client component)
│   ├── globals.css             # Global styles + Tailwind
│   └── api/
│       └── chat/
│           └── route.ts        # Chat API endpoint
├── components/
│   ├── ChatWindow.tsx          # Scrollable message container
│   ├── ChatInput.tsx           # Message input with send button
│   ├── MessageBubble.tsx       # Individual message display
│   ├── VideoCard.tsx           # Video player card
│   └── StatusSteps.tsx         # Pipeline progress indicator
├── lib/
│   ├── types.ts                # TypeScript interfaces
│   ├── intent.ts               # Intent detection (rule-based)
│   ├── extractProduct.ts       # Product info extraction
│   ├── scrapeWebsite.ts        # Website scraping with Cheerio
│   ├── summarizeProduct.ts     # AI product summarization
│   ├── creativeBrief.ts        # AI creative brief generation
│   ├── assetSearch.ts          # Pexels/Giphy/audio asset search
│   ├── videoComposer.ts        # Pipeline orchestrator
│   ├── ffmpeg.ts               # FFmpeg video composition
│   └── utils.ts                # Utility functions
├── public/
│   ├── audio/                  # Local audio tracks
│   │   ├── trendy-1.mp3
│   │   ├── trendy-2.mp3
│   │   └── trendy-3.mp3
│   └── outputs/                # Generated videos
├── scripts/
│   └── generate-audio.mjs      # Audio placeholder generator
├── .env.local.example          # Environment variables template
├── .gitignore
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tsconfig.json
└── README.md
```

## Tradeoffs & Design Decisions

### What was simplified for the MVP

| Area | Decision | Rationale |
|------|----------|-----------|
| **Intent detection** | Rule-based regex instead of LLM | Faster, more reliable, zero cost — works great for defined intents |
| **Audio selection** | Local files mapped by mood | Avoids complex audio API integration; easy to swap tracks |
| **Video duration** | Fixed 7 seconds | Keeps FFmpeg pipeline simple and predictable |
| **Session state** | Client-side only | No database needed for demo; messages persist per tab |
| **Streaming** | Single response (not SSE) | Simpler implementation; progress shown client-side |
| **GIF format** | Downloaded and overlaid as-is | Avoids complex GIF-to-video conversion issues |

### Error Handling & Fallbacks

The app is designed to never hard-fail. Every step has a fallback:

- **Website scrape fails** → Use the user's message text as product description
- **OpenAI unavailable** → Fall back to template-based creative brief
- **Pexels returns nothing** → Generate a solid-color gradient background via FFmpeg
- **Giphy returns nothing** → Skip GIF overlay gracefully
- **Audio file missing** → Generate silent placeholder
- **FFmpeg errors** → Return error message in chat, not a crash

### What I'd improve with more time

1. **Server-Sent Events (SSE)** — Stream real pipeline progress to the frontend instead of simulating steps
2. **Video preview thumbnails** — Generate a poster frame before the full video loads
3. **Multiple video variants** — Generate 2-3 creative angles and let the user pick
4. **Asset caching** — Cache downloaded backgrounds and GIFs to speed up repeat generations
5. **Persistent sessions** — Store chat history in a database (Supabase, Redis)
6. **Better GIF handling** — Convert GIFs to WebM for smoother overlay compositing
7. **Voice-over** — Add TTS narration using ElevenLabs or OpenAI TTS
8. **Template system** — Let users pick from video templates (minimal, bold, meme-style)
9. **Export options** — Support different aspect ratios (9:16, 1:1, 16:9)
10. **Queue system** — Use a job queue (BullMQ) for video rendering to avoid request timeouts

## License

MIT
