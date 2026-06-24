import path from 'path';
import { mkdir } from 'fs/promises';
import { ProductInput, ScrapedContent, CreativeBrief } from './types';
import { summarizeProduct } from './summarizeProduct';
import { generateCreativeBrief } from './creativeBrief';
import { searchBackground, searchGif, selectAudio } from './assetSearch';
import { composeUGCVideo } from './ffmpeg';

/**
 * Orchestrate the full video generation pipeline:
 * 1. Summarize the product
 * 2. Generate a creative brief
 * 3. Search for assets (background, GIF, audio) in parallel
 * 4. Compose the video using FFmpeg
 * 5. Return the public URL and creative brief
 */
export async function generateVideo(
  product: ProductInput,
  scraped: ScrapedContent,
  userMessage: string
): Promise<{ videoUrl: string; brief: CreativeBrief }> {
  // Step 1: Summarize the product
  let productSummary: string;
  try {
    productSummary = await summarizeProduct(product, scraped);
  } catch (error) {
    console.warn('Product summarization failed, using fallback:', error);
    productSummary =
      product.description ||
      scraped.description ||
      scraped.title ||
      'An innovative product';
  }

  const productName = product.name || scraped.title || 'Product';

  // Step 2: Generate creative brief
  let brief: CreativeBrief;
  try {
    brief = await generateCreativeBrief(productName, productSummary, userMessage);
  } catch (error) {
    console.warn('Creative brief generation failed, using fallback:', error);
    brief = {
      productName,
      productSummary,
      hook: `POV: you just found ${productName}`,
      caption: `This changes everything fr`,
      gifQuery: 'surprised reaction',
      backgroundQuery: 'modern technology',
      audioMood: 'upbeat',
      tone: 'excited and trendy',
      angle: `Show off ${productName} with a relatable hook`,
    };
  }

  // Step 3: Search for assets in parallel
  const [backgroundResult, gifPath, audioPath] = await Promise.all([
    searchBackground(brief.backgroundQuery).catch((err) => {
      console.warn('Background search failed:', err);
      return { path: '', type: 'image' as const };
    }),
    searchGif(brief.gifQuery).catch((err) => {
      console.warn('GIF search failed:', err);
      return '';
    }),
    selectAudio(brief.audioMood).catch((err) => {
      console.warn('Audio selection failed:', err);
      return '';
    }),
  ]);

  // Step 4: Compose the video
  const timestamp = Date.now();
  const outputFilename = `video-${timestamp}.mp4`;
  const outputDir = path.join(process.cwd(), 'public', 'outputs');
  await mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, outputFilename);

  try {
    await composeUGCVideo({
      backgroundPath: backgroundResult.path,
      gifPath: gifPath,
      audioPath: audioPath,
      hook: brief.hook,
      caption: brief.caption,
      outputPath,
    });
  } catch (error) {
    console.error('Video composition failed:', error);
    throw new Error(
      `Video composition failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // Step 5: Return the public URL and brief
  const videoUrl = `/outputs/${outputFilename}`;
  return { videoUrl, brief };
}
