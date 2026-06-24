import { Intent } from './types';

/**
 * Detect the user's intent from their chat message using rule-based pattern matching.
 * No LLM required — uses regex patterns for classification.
 */
export function detectIntent(message: string): Intent {
  const trimmed = message.trim();

  // Check for greeting patterns
  const greetingPattern = /^(hi|hello|hey|sup|yo|what's up|howdy)\b/i;
  if (greetingPattern.test(trimmed)) {
    return 'greeting';
  }

  // Check for capability/help question patterns
  const capabilityPattern = /(what can you do|help|how does this work|what is this|capabilities)/i;
  if (capabilityPattern.test(trimmed)) {
    return 'capability_question';
  }

  // Check for product video request patterns
  // 1. URL detection: explicit protocols or common TLDs
  const urlPattern = /(https?:\/\/[^\s]+|[a-zA-Z0-9][-a-zA-Z0-9]*\.(com|app|io|co|net|org|dev|ai|xyz|tech|gg|so|me|us|uk|ca|de)\b)/i;
  if (urlPattern.test(trimmed)) {
    return 'product_video_request';
  }

  // 2. Product-related phrases
  const productPhrasePattern = /(i'?m building|i made|i built|check out|my product|my app|my website|generate a video|create a video|make a video|make me a video|create me a video)/i;
  if (productPhrasePattern.test(trimmed)) {
    return 'product_video_request';
  }

  // Default fallback
  return 'fallback_chat';
}
