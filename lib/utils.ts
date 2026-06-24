import { randomUUID } from 'crypto';

/**
 * Generate a unique string ID.
 * Uses crypto.randomUUID when available, falls back to Math.random.
 */
export function generateId(): string {
  try {
    return randomUUID();
  } catch {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }
}

/**
 * Escape special characters for FFmpeg drawtext filter.
 * FFmpeg drawtext requires escaping of: ' : \ [ ] ; ,
 */
export function sanitizeForFFmpeg(text: string): string {
  return text
    .replace(/\\/g, '\\\\\\\\')   // backslash
    .replace(/'/g, '\u2019')       // replace single quote with unicode right single quote
    .replace(/:/g, '\\:')         // colon
    .replace(/%/g, '%%')          // percent
    .replace(/\n/g, ' ')          // newlines
    .replace(/\r/g, '')           // carriage return
    .replace(/"/g, '\u201C')      // double quote to unicode left double quote
    .replace(/\[/g, '\\[')       // brackets
    .replace(/\]/g, '\\]')
    .replace(/;/g, '\\;');        // semicolon
}

/**
 * Normalize a URL by adding https:// if no protocol is present.
 */
export function normalizeUrl(url: string): string {
  let normalized = url.trim();

  // Already has a protocol
  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }

  // Has www. prefix but no protocol
  if (/^www\./i.test(normalized)) {
    return `https://${normalized}`;
  }

  // Looks like a domain (contains dot, no spaces)
  if (/^[^\s]+\.[a-z]{2,}/i.test(normalized)) {
    return `https://${normalized}`;
  }

  // Fallback: just prepend https://
  return `https://${normalized}`;
}

/**
 * Promise-based delay.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
