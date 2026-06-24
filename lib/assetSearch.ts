import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const TMP_DIR = path.join(process.cwd(), 'tmp');
const PUBLIC_DIR = path.join(process.cwd(), 'public');

/**
 * Ensure the tmp directory exists.
 */
async function ensureTmpDir(): Promise<void> {
  await mkdir(TMP_DIR, { recursive: true });
}

/**
 * Download a file from a URL and save it to a local path.
 */
async function downloadFile(url: string, outputPath: string): Promise<void> {
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });

  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await writeFile(outputPath, buffer);
}

/**
 * Search for a background video or image using the Pexels API.
 * Tries videos first, then falls back to photos.
 * Returns a fallback path if the API is unavailable.
 */
export async function searchBackground(
  query: string
): Promise<{ path: string; type: 'video' | 'image' }> {
  const apiKey = process.env.PEXELS_API_KEY;

  if (!apiKey) {
    console.warn('PEXELS_API_KEY not set, using fallback background');
    return { path: '', type: 'image' };
  }

  await ensureTmpDir();
  const timestamp = Date.now();

  try {
    // Try videos first
    const videoRes = await fetch(
      `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=1&orientation=portrait`,
      { headers: { Authorization: apiKey } }
    );

    if (videoRes.ok) {
      const videoData = await videoRes.json();
      if (videoData.videos && videoData.videos.length > 0) {
        const video = videoData.videos[0];
        // Find the best quality video file (prefer HD)
        const videoFiles = video.video_files || [];
        const hdFile =
          videoFiles.find(
            (f: { quality: string }) => f.quality === 'hd'
          ) ||
          videoFiles.find(
            (f: { quality: string }) => f.quality === 'sd'
          ) ||
          videoFiles[0];

        if (hdFile?.link) {
          const outputPath = path.join(TMP_DIR, `bg-${timestamp}.mp4`);
          await downloadFile(hdFile.link, outputPath);
          return { path: outputPath, type: 'video' };
        }
      }
    }

    // Fallback to photos
    const photoRes = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=portrait`,
      { headers: { Authorization: apiKey } }
    );

    if (photoRes.ok) {
      const photoData = await photoRes.json();
      if (photoData.photos && photoData.photos.length > 0) {
        const photo = photoData.photos[0];
        const photoUrl =
          photo.src?.large2x || photo.src?.large || photo.src?.original;
        if (photoUrl) {
          const outputPath = path.join(TMP_DIR, `bg-${timestamp}.jpg`);
          await downloadFile(photoUrl, outputPath);
          return { path: outputPath, type: 'image' };
        }
      }
    }

    console.warn('No Pexels results found, using fallback background');
    return { path: '', type: 'image' };
  } catch (error) {
    console.warn('Pexels search failed:', error);
    return { path: '', type: 'image' };
  }
}

/**
 * Search for a GIF using the Giphy API.
 * Returns the path to the downloaded GIF, or empty string on failure.
 */
export async function searchGif(query: string): Promise<string> {
  const apiKey = process.env.GIPHY_API_KEY;

  if (!apiKey) {
    console.warn('GIPHY_API_KEY not set, skipping GIF');
    return '';
  }

  await ensureTmpDir();

  try {
    const res = await fetch(
      `https://api.giphy.com/v1/gifs/search?api_key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(query)}&limit=1&rating=g`
    );

    if (!res.ok) {
      console.warn(`Giphy API returned ${res.status}`);
      return '';
    }

    const data = await res.json();
    if (!data.data || data.data.length === 0) {
      console.warn('No Giphy results found');
      return '';
    }

    const gif = data.data[0];
    const gifUrl =
      gif.images?.downsized?.url ||
      gif.images?.downsized_medium?.url ||
      gif.images?.original?.url;

    if (!gifUrl) {
      console.warn('No GIF URL in Giphy response');
      return '';
    }

    const outputPath = path.join(TMP_DIR, `gif-${Date.now()}.gif`);
    await downloadFile(gifUrl, outputPath);
    return outputPath;
  } catch (error) {
    console.warn('Giphy search failed:', error);
    return '';
  }
}

/**
 * Select an audio file based on mood.
 * Maps mood strings to local audio files in public/audio/.
 */
export async function selectAudio(mood: string): Promise<string> {
  const moodMap: Record<string, string> = {
    upbeat: 'trendy-1.mp3',
    funny: 'trendy-2.mp3',
    dramatic: 'trendy-3.mp3',
    chill: 'trendy-1.mp3',
    hype: 'trendy-3.mp3',
  };

  const filename = moodMap[mood.toLowerCase()] || 'trendy-1.mp3';
  return path.join(PUBLIC_DIR, 'audio', filename);
}
