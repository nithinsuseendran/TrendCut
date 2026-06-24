export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  videoUrl?: string;
  steps?: PipelineStep[];
}

export interface PipelineStep {
  label: string;
  status: 'pending' | 'active' | 'done';
}

export type Intent = 'greeting' | 'capability_question' | 'product_video_request' | 'fallback_chat';

export interface ProductInput {
  name?: string;
  url?: string;
  description?: string;
}

export interface ScrapedContent {
  title?: string;
  description?: string;
  headings: string[];
  bodyText: string;
}

export interface CreativeBrief {
  productName: string;
  productSummary: string;
  hook: string;
  caption: string;
  gifQuery: string;
  backgroundQuery: string;
  audioMood: string;
  tone: string;
  angle: string;
}

export interface VideoCompositionInput {
  backgroundPath: string;
  gifPath: string;
  audioPath: string;
  hook: string;
  caption?: string;
  outputPath: string;
}

export interface AssetPaths {
  backgroundPath: string;
  gifPath: string;
  audioPath: string;
}
