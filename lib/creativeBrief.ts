import OpenAI from 'openai';
import { CreativeBrief } from './types';

/**
 * Generate a creative brief for a UGC-style marketing video using OpenAI.
 * Falls back to a sensible default brief if OpenAI is unavailable or fails.
 */
export async function generateCreativeBrief(
  productName: string,
  productSummary: string,
  userMessage: string
): Promise<CreativeBrief> {
  const fallbackBrief: CreativeBrief = {
    productName,
    productSummary,
    hook: `POV: you just discovered ${productName} and your life changed`,
    caption: `${productName} is literally the future no cap`,
    gifQuery: 'mind blown reaction',
    backgroundQuery: `${productName} technology modern`,
    audioMood: 'upbeat',
    tone: 'excited, trendy, Gen Z energy',
    angle: `Introduce ${productName} as a game-changer using a relatable POV hook`,
  };

  // Check if OpenAI API key is configured
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY not set, using fallback creative brief');
    return fallbackBrief;
  }

  try {
    const openai = new OpenAI();

    const prompt = `You are a viral UGC content strategist who creates short-form video concepts for TikTok and Instagram Reels.

Given a product, create a creative brief for a 6-8 second UGC-style marketing video.

Product name: ${productName}
Product summary: ${productSummary}
User message: ${userMessage}

Requirements:
- The "hook" should be a punchy, trendy first line (POV:, when you..., me when..., etc.)
- The "caption" should be a relatable follow-up line
- The "gifQuery" should describe a funny/relatable reaction GIF to search for
- The "backgroundQuery" should describe a relevant stock video/photo background
- The "audioMood" must be one of: upbeat, funny, dramatic, chill, hype
- The "tone" should describe the vibe
- The "angle" should explain the creative strategy in one sentence

Do NOT write generic marketing copy. Write like a Gen Z creator making content.
Be funny, clever, and meme-aware.

Respond with ONLY valid JSON in this exact format:
{
  "productName": "...",
  "productSummary": "...",
  "hook": "...",
  "caption": "...",
  "gifQuery": "...",
  "backgroundQuery": "...",
  "audioMood": "...",
  "tone": "...",
  "angle": "..."
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.9,
    });

    const rawContent = completion.choices[0]?.message?.content?.trim();
    if (!rawContent) {
      console.warn('Empty response from OpenAI, using fallback brief');
      return fallbackBrief;
    }

    // Extract JSON from the response (handle potential markdown code blocks)
    let jsonStr = rawContent;
    const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(jsonStr) as CreativeBrief;

    // Validate required fields, merge with fallback for any missing ones
    const validMoods = ['upbeat', 'funny', 'dramatic', 'chill', 'hype'];
    return {
      productName: parsed.productName || fallbackBrief.productName,
      productSummary: parsed.productSummary || fallbackBrief.productSummary,
      hook: parsed.hook || fallbackBrief.hook,
      caption: parsed.caption || fallbackBrief.caption,
      gifQuery: parsed.gifQuery || fallbackBrief.gifQuery,
      backgroundQuery: parsed.backgroundQuery || fallbackBrief.backgroundQuery,
      audioMood: validMoods.includes(parsed.audioMood)
        ? parsed.audioMood
        : fallbackBrief.audioMood,
      tone: parsed.tone || fallbackBrief.tone,
      angle: parsed.angle || fallbackBrief.angle,
    };
  } catch (error) {
    console.warn('Creative brief generation failed, using fallback:', error);
    return fallbackBrief;
  }
}
