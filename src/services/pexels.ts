/**
 * Pexels Video Search and Download Service
 * Searches for stock footage with semantic queries
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import type { VideoAsset } from '../types.js';

/**
 * Pexels API response format
 */
interface PexelsSearchResponse {
  videos: Array<{
    id: number;
    width: number;
    height: number;
    video_files: Array<{
      id: number;
      quality: string;
      file_type: string;
      width: number;
      height: number;
      link: string;
    }>;
  }>;
}

/**
 * Search and download video from Pexels
 *
 * @param query - Search query (use metaphorical/feeling-based terms)
 * @param outputPath - Path to save video file
 * @param apiKey - Pexels API key
 * @param minDuration - Minimum duration in seconds (not enforced by API)
 * @returns VideoAsset with path and dimensions
 */
const FALLBACK_QUERIES = [
  'technology abstract',
  'city lights night',
  'ocean waves',
  'nature landscape',
  'sky clouds timelapse',
];

export async function searchAndDownload(
  query: string,
  outputPath: string,
  apiKey: string,
  minDuration: number = 0
): Promise<VideoAsset | null> {
  // Check if file already exists (avoid redundant API calls)
  try {
    await fs.access(outputPath);
    const stats = await fs.stat(outputPath);
    if (stats.size > 0) {
      console.log(`  ✅ Cached: ${outputPath}`);
      const duration = await getVideoDuration(outputPath);
      return { file_path: outputPath, width: 1920, height: 1080, duration };
    }
  } catch {
    // File doesn't exist, proceed
  }

  // Try the original query, then fallbacks
  const queries = [query, ...FALLBACK_QUERIES];

  for (const q of queries) {
    console.log(`  Searching Pexels: "${q}"`);
    try {
      const result = await searchPexels(q, apiKey);
      if (!result) continue;

      await downloadFile(result.link, outputPath);
      console.log(`  ✅ Downloaded: ${outputPath}`);
      const duration = await getVideoDuration(outputPath);

      return {
        file_path: outputPath,
        width: result.width,
        height: result.height,
        duration,
      };
    } catch (error) {
      console.warn(`  ⚠ Failed for "${q}": ${error}`);
    }
  }

  console.error(`  ❌ No video found for any query. Skipping.`);
  return null;
}

async function searchPexels(
  query: string,
  apiKey: string
): Promise<{ link: string; width: number; height: number } | null> {
  const url = new URL('https://api.pexels.com/videos/search');
  url.searchParams.set('query', query);
  url.searchParams.set('per_page', '5');
  url.searchParams.set('orientation', 'landscape');

  const response = await fetch(url.toString(), {
    headers: { Authorization: apiKey },
  });

  if (!response.ok) {
    throw new Error(`Pexels API ${response.status}: ${await response.text()}`);
  }

  const data = (await response.json()) as PexelsSearchResponse;

  if (!data.videos || data.videos.length === 0) return null;

  // Pick first video with a usable file
  for (const video of data.videos) {
    const file =
      video.video_files.find((v) => v.width >= 1920 && v.file_type === 'video/mp4') ||
      video.video_files.find((v) => v.width >= 1280 && v.file_type === 'video/mp4') ||
      video.video_files.find((v) => v.file_type === 'video/mp4');
    if (file) {
      return { link: file.link, width: file.width, height: file.height };
    }
  }

  return null;
}

async function downloadFile(url: string, outputPath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed: ${response.status}`);
  if (!response.body) throw new Error('No response body');

  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(outputPath, buffer);
}

/**
 * Get video duration using FFprobe
 */
async function getVideoDuration(filePath: string): Promise<number> {
  return new Promise((resolve) => {
    const ffprobe = spawn('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      filePath,
    ]);

    let stdout = '';
    ffprobe.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    ffprobe.on('close', (code) => {
      if (code === 0) {
        const duration = parseFloat(stdout.trim());
        resolve(isNaN(duration) ? 5.0 : duration);
      } else {
        resolve(5.0); // Fallback duration
      }
    });

    ffprobe.on('error', () => {
      resolve(5.0); // Fallback duration
    });
  });
}
