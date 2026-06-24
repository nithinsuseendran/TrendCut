/**
 * Script to generate placeholder audio files using FFmpeg.
 * Run: node scripts/generate-audio.mjs
 * 
 * These are silent 10-second MP3 files used as placeholders.
 * Replace them with actual royalty-free audio tracks for production.
 * 
 * Recommended free audio sources:
 *   - https://pixabay.com/music/
 *   - https://freesound.org/
 *   - YouTube Audio Library
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const audioDir = path.join(__dirname, '..', 'public', 'audio');

const tracks = [
  { name: 'trendy-1.mp3', description: 'upbeat / chill' },
  { name: 'trendy-2.mp3', description: 'funny / quirky' },
  { name: 'trendy-3.mp3', description: 'dramatic / hype' },
];

for (const track of tracks) {
  const outputPath = path.join(audioDir, track.name);
  
  if (existsSync(outputPath)) {
    console.log(`✓ ${track.name} already exists, skipping.`);
    continue;
  }
  
  console.log(`Generating ${track.name} (${track.description})...`);
  
  try {
    // Generate a 10-second audio file with a simple sine wave tone
    // This is a placeholder — replace with real royalty-free tracks
    execSync(
      `ffmpeg -y -f lavfi -i "sine=frequency=440:duration=10" -af "volume=0.05" -c:a libmp3lame -q:a 9 "${outputPath}"`,
      { stdio: 'pipe' }
    );
    console.log(`  ✓ Created ${track.name}`);
  } catch (error) {
    console.error(`  ✗ Failed to create ${track.name}. Make sure FFmpeg is installed.`);
    console.error(`    Error: ${error.message}`);
  }
}

console.log('\nDone! Replace these placeholder files with real audio tracks for better results.');
