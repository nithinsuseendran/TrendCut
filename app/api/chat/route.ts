import { NextRequest, NextResponse } from 'next/server';
import { detectIntent } from '@/lib/intent';
import { extractProduct } from '@/lib/extractProduct';
import { scrapeWebsite } from '@/lib/scrapeWebsite';
import { generateVideo } from '@/lib/videoComposer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message: string = body.message;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { reply: 'Please send a message to get started!' },
        { status: 400 }
      );
    }

    const intent = detectIntent(message);

    switch (intent) {
      case 'greeting': {
        return NextResponse.json({
          reply: "Hey! Send me your product URL and I'll turn it into a short UGC-style marketing video. 🎬",
        });
      }

      case 'capability_question': {
        return NextResponse.json({
          reply: 'I can create short UGC-style marketing videos for your product! Just send me a product description or website URL, and I\'ll analyze it, pick visuals, GIFs, and audio, then generate a trendy short video. Try something like: "I\'m building CalAI, a calorie tracking app. Here\'s the site: calai.app"',
        });
      }

      case 'product_video_request': {
        // Extract product details from the message
        const product = extractProduct(message);

        // Scrape website if a URL was found
        let scraped = { headings: [] as string[], bodyText: '' };
        if (product.url) {
          try {
            scraped = await scrapeWebsite(product.url);
          } catch (error) {
            console.warn('Website scraping failed:', error);
          }
        }

        // Generate the video through the full pipeline
        const { videoUrl, brief } = await generateVideo(
          product,
          scraped,
          message
        );

        const productName = brief.productName || product.name || 'your product';

        return NextResponse.json({
          reply: `Here's your UGC video for ${productName}! 🎬🔥`,
          videoUrl,
        });
      }

      case 'fallback_chat':
      default: {
        return NextResponse.json({
          reply: "I'm not sure what you mean. Try sending me a product URL or description and I'll create a UGC-style marketing video for you!",
        });
      }
    }
  } catch (error) {
    console.error('Chat API error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        reply: `Oops, something went wrong while processing your request. Please try again! (${errorMessage})`,
      },
      { status: 500 }
    );
  }
}
