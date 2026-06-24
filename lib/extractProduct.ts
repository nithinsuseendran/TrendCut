import { ProductInput } from './types';

/**
 * Extract product details (name, URL, description) from a user message.
 */
export function extractProduct(message: string): ProductInput {
  const result: ProductInput = {};

  // Extract URL
  // Match full URLs with protocol
  const fullUrlMatch = message.match(/https?:\/\/[^\s)]+/i);
  // Match domain-like patterns without protocol
  const domainMatch = message.match(
    /(?:^|\s)((?:www\.)?[a-zA-Z0-9][-a-zA-Z0-9]*\.(com|app|io|co|net|org|dev|ai|xyz|tech|gg|so|me|us|uk|ca|de)(?:\/[^\s)]*)?)/i
  );

  if (fullUrlMatch) {
    result.url = fullUrlMatch[0].replace(/[.,;!?]+$/, ''); // strip trailing punctuation
  } else if (domainMatch) {
    result.url = domainMatch[1].replace(/[.,;!?]+$/, '');
  }

  // Try to extract product name from common phrases
  const namePatterns = [
    /(?:(?:i'?m\s+)?building|built|created|made|launched|developing)\s+(?:an?\s+)?(?:app\s+)?(?:called\s+|named\s+)?["']?([A-Z][a-zA-Z0-9\s]{1,30}?)["']?(?:\s*[,.\-!]|\s+(?:it|that|which|and|a|the|is|for|on|at|—|-))/i,
    /(?:called|named|it'?s)\s+["']?([A-Z][a-zA-Z0-9\s]{1,25}?)["']?(?:\s*[,.\-!]|\s|$)/i,
    /(?:my (?:product|app|website|tool|service|platform|startup))\s+(?:is\s+)?["']?([A-Z][a-zA-Z0-9\s]{1,25}?)["']?(?:\s*[,.\-!]|\s|$)/i,
    /(?:check out|look at)\s+["']?([A-Z][a-zA-Z0-9\s]{1,25}?)["']?(?:\s*[,.\-!]|\s|$)/i,
  ];

  for (const pattern of namePatterns) {
    const nameMatch = message.match(pattern);
    if (nameMatch && nameMatch[1]) {
      result.name = nameMatch[1].trim();
      break;
    }
  }

  // If no name found from phrases, try to extract from URL domain
  if (!result.name && result.url) {
    try {
      const urlStr = result.url.startsWith('http')
        ? result.url
        : `https://${result.url}`;
      const hostname = new URL(urlStr).hostname;
      // Remove www. and TLD, capitalize first letter
      const domain = hostname
        .replace(/^www\./, '')
        .split('.')[0];
      if (domain && domain.length > 1) {
        result.name = domain.charAt(0).toUpperCase() + domain.slice(1);
      }
    } catch {
      // URL parsing failed, leave name undefined
    }
  }

  // Use the rest of the message (minus URL) as description
  let description = message;
  // Remove the URL from the description
  if (fullUrlMatch) {
    description = description.replace(fullUrlMatch[0], '');
  }
  if (domainMatch) {
    description = description.replace(domainMatch[0], '');
  }
  // Clean up the description
  description = description
    .replace(/\s+/g, ' ')
    .replace(/^[\s,.\-:]+/, '')
    .replace(/[\s,.\-:]+$/, '')
    .trim();

  if (description.length > 5) {
    result.description = description;
  }

  return result;
}
