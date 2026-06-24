import { exec } from 'child_process';
import { promisify } from 'util';
import { mkdir, access } from 'fs/promises';
import path from 'path';
import { VideoCompositionInput } from './types';
import { sanitizeForFFmpeg } from './utils';

const execAsync = promisify(exec);

/**
 * Check if a file exists.
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Determine if a file is an image based on extension.
 */
function isImageFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.bmp', '.webp', '.tiff'].includes(ext);
}

/**
 * Compose a UGC-style video using FFmpeg.
 *
 * Takes a background (image or video), optional GIF overlay, audio track,
 * and text overlays (hook + caption) and renders a 1080x1920 9:16 MP4.
 */
export async function composeUGCVideo(
  input: VideoCompositionInput
): Promise<string> {
  // Ensure output directory exists
  const outputDir = path.dirname(input.outputPath);
  await mkdir(outputDir, { recursive: true });

  const hasGif = input.gifPath && (await fileExists(input.gifPath));
  const hasAudio = input.audioPath && (await fileExists(input.audioPath));
  const hasBackground =
    input.backgroundPath && (await fileExists(input.backgroundPath));
  const bgIsImage = hasBackground ? isImageFile(input.backgroundPath) : true;

  // Sanitize text for FFmpeg drawtext
  const hookText = sanitizeForFFmpeg(input.hook || '');
  const captionText = sanitizeForFFmpeg(input.caption || '');

  // Build input arguments
  const inputs: string[] = [];
  let inputIndex = 0;

  // Input 0: background
  if (hasBackground && bgIsImage) {
    inputs.push(`-loop 1 -i "${input.backgroundPath}"`);
  } else if (hasBackground) {
    inputs.push(`-i "${input.backgroundPath}"`);
  } else {
    // Generate a solid dark background using lavfi
    inputs.push(
      `-f lavfi -i "color=c=0x1a1a2e:s=1080x1920:d=7:r=30"`
    );
  }
  const bgIndex = inputIndex++;

  // Input 1: GIF (optional)
  let gifIndex = -1;
  if (hasGif) {
    inputs.push(`-ignore_loop 0 -i "${input.gifPath}"`);
    gifIndex = inputIndex++;
  }

  // Input for audio (optional)
  let audioIndex = -1;
  if (hasAudio) {
    inputs.push(`-i "${input.audioPath}"`);
    audioIndex = inputIndex++;
  }

  // Build filter_complex
  const filters: string[] = [];
  let currentLabel = 'bg';

  // Scale background to 1080x1920
  filters.push(
    `[${bgIndex}:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30${bgIsImage || !hasBackground ? ',trim=duration=7' : ''}[${currentLabel}]`
  );

  // Overlay GIF in bottom-right area
  if (hasGif && gifIndex >= 0) {
    const nextLabel = 'vid';
    filters.push(
      `[${gifIndex}:v]scale=280:280:flags=lanczos,format=rgba[gif]`
    );
    filters.push(
      `[${currentLabel}][gif]overlay=W-300:H-350:shortest=1[${nextLabel}]`
    );
    currentLabel = nextLabel;
  }

  // Draw hook text (large, white, black outline, centered near top)
  if (hookText) {
    const nextLabel = 'vid2';
    filters.push(
      `[${currentLabel}]drawtext=text='${hookText}':fontsize=52:fontcolor=white:borderw=3:bordercolor=black:x=(w-text_w)/2:y=h*0.15:font=Arial[${nextLabel}]`
    );
    currentLabel = nextLabel;
  }

  // Draw caption text (smaller, white, centered near bottom)
  if (captionText) {
    const nextLabel = 'final';
    filters.push(
      `[${currentLabel}]drawtext=text='${captionText}':fontsize=36:fontcolor=white:borderw=2:bordercolor=black:x=(w-text_w)/2:y=h*0.78:font=Arial[${nextLabel}]`
    );
    currentLabel = nextLabel;
  }

  // Build the full FFmpeg command
  const filterComplex = filters.join(';');
  const inputArgs = inputs.join(' ');

  let mapArgs: string;
  if (hasAudio) {
    mapArgs = `-map "[${currentLabel}]" -map ${audioIndex}:a`;
  } else {
    mapArgs = `-map "[${currentLabel}]"`;
  }

  const command = [
    'ffmpeg -y',
    inputArgs,
    `-filter_complex "${filterComplex}"`,
    mapArgs,
    '-t 7',
    '-c:v libx264 -preset fast -crf 23',
    hasAudio ? '-c:a aac -b:a 128k -shortest' : '-an',
    `"${input.outputPath}"`,
  ].join(' ');

  console.log('FFmpeg command:', command);

  try {
    const { stdout, stderr } = await execAsync(command, {
      timeout: 120_000, // 2-minute timeout
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });

    if (stderr) {
      // FFmpeg outputs progress to stderr, this is normal
      console.log('FFmpeg stderr (normal):', stderr.substring(0, 500));
    }

    return input.outputPath;
  } catch (error: unknown) {
    const errMsg =
      error instanceof Error ? error.message : String(error);
    console.error('FFmpeg execution failed:', errMsg);
    throw new Error(`Video composition failed: ${errMsg}`);
  }
}
