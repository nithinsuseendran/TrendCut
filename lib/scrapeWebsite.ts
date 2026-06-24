import * as cheerio from 'cheerio';
import { ScrapedContent } from './types';
import { normalizeUrl } from './utils';

/**
 * Scrape a website URL and extract structured content.
 * Handles errors gracefully, returning partial or empty results.
 */
export async function scrapeWebsite(url: string): Promise<ScrapedContent> {
  const empty: ScrapedContent = {
    headings: [],
    bodyText: '',
  };

  try {
    const normalizedUrl = normalizeUrl(url);

    // Fetch with a 10-second timeout and browser-like headers
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);

    let response: Response;
    try {
      response = await fetch(normalizedUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      console.warn(`Scrape failed with status ${response.status} for ${normalizedUrl}`);
      return empty;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove script, style, nav, footer, header elements for cleaner text
    $('script, style, nav, footer, header, noscript, iframe, svg').remove();

    // Extract title
    const title = $('title').first().text().trim() || undefined;

    // Extract meta description
    const description =
      $('meta[name="description"]').attr('content')?.trim() ||
      $('meta[property="og:description"]').attr('content')?.trim() ||
      undefined;

    // Extract headings (h1, h2, h3)
    const headings: string[] = [];
    $('h1, h2, h3').each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 1 && text.length < 200) {
        headings.push(text);
      }
    });

    // Extract body text
    let bodyText = $('body').text() || '';
    // Clean up whitespace
    bodyText = bodyText
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .trim();

    // Limit to 2000 characters
    if (bodyText.length > 2000) {
      bodyText = bodyText.substring(0, 2000);
    }

    return {
      title,
      description,
      headings: headings.slice(0, 20), // limit to 20 headings
      bodyText,
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.warn(`Scrape timed out for ${url}`);
    } else {
      console.warn(`Scrape error for ${url}:`, error);
    }
    return empty;
  }
}
