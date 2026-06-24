import OpenAI from 'openai';
import { ProductInput, ScrapedContent } from './types';

/**
 * Summarize scraped content into a concise product summary using OpenAI.
 * Falls back to a simple concatenation if OpenAI is not configured or fails.
 */
export async function summarizeProduct(
  product: ProductInput,
  scraped: ScrapedContent
): Promise<string> {
  // Build the fallback summary from raw data
  const fallbackParts: string[] = [];
  if (scraped.title) fallbackParts.push(scraped.title);
  if (scraped.description) fallbackParts.push(scraped.description);
  if (scraped.bodyText) {
    fallbackParts.push(scraped.bodyText.substring(0, 200));
  }
  if (product.description) {
    fallbackParts.push(product.description);
  }
  const fallbackSummary =
    fallbackParts.join('. ').trim() || 'A product with no available description.';

  // Check if OpenAI API key is configured
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY not set, using fallback summary');
    return fallbackSummary;
  }

  try {
    const openai = new OpenAI();

    const prompt = `You are a product analyst. Given the following website content, write a concise 2-3 sentence summary of what this product does, who it's for, and its key value proposition.

Product name: ${product.name || 'Unknown'}
Website title: ${scraped.title || 'N/A'}
Meta description: ${scraped.description || 'N/A'}
Headings: ${scraped.headings.join(', ') || 'N/A'}
Body text: ${scraped.bodyText || 'N/A'}

Respond with only the summary, no extra text.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.5,
    });

    const summary = completion.choices[0]?.message?.content?.trim();
    return summary || fallbackSummary;
  } catch (error) {
    console.warn('OpenAI summarization failed, using fallback:', error);
    return fallbackSummary;
  }
}
