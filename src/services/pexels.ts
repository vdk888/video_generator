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
export async function searchAndDownload(
  query: string,
  outputPath: string,
  apiKey: string,
  minDuration: number = 0
): Promise<VideoAsset> {
  console.log(`Searching Pexels for: "${query}"`);

  // Check if file already exists (avoid redundant API calls)
  try {
    await fs.access(outputPath);
    const stats = await fs.stat(outputPath);
    if (stats.size > 0) {
      console.log(`File exists: ${outputPath}. Skipping download.`);
      return {
        file_path: outputPath,
        width: 1920,
        height: 1080,
        duration: 0, // Unknown duration for cached files
      };
    }
  } catch (error) {
    // File doesn't exist, proceed with download
  }

  try {
    // Search for landscape HD videos
    const url = new URL('https://api.pexels.com/videos/search');
    url.searchParams.set('query', query);
    url.searchParams.set('per_page', '1');
    url.searchParams.set('orientation', 'landscape');
    url.searchParams.set('size', 'large'); // HD quality

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pexels API error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as PexelsSearchResponse;

    if (!data.videos || data.videos.length === 0) {
      console.log(`No videos found for "${query}". Using fallback.`);
      return await searchAndDownload('abstract digital background', outputPath, apiKey, minDuration);
    }

    const video = data.videos[0];
    const videoFiles = video.video_files || [];

    // Pick best quality: prioritize 1080p or higher
    let bestVideo = videoFiles.find((v) => v.width >= 1920);
    if (!bestVideo && videoFiles.length > 0) {
      bestVideo = videoFiles[0];
    }

    if (!bestVideo) {
      throw new Error('No video file found in Pexels response');
    }

    // Download video
    console.log(`Downloading video from ${bestVideo.link}...`);
    const videoResponse = await fetch(bestVideo.link);

    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: status ${videoResponse.status}`);
    }

    if (!videoResponse.body) {
      throw new Error('No response body from video URL');
    }

    // Stream to file
    const fileHandle = await fs.open(outputPath, 'w');
    const writable = fileHandle.createWriteStream();

    try {
      const reader = videoResponse.body.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        writable.write(value);
      }

      writable.end();
      await new Promise<void>((resolve, reject) => {
        writable.on('finish', () => resolve());
        writable.on('error', reject);
      });
    } finally {
      await fileHandle.close();
    }

    console.log(`Video downloaded: ${outputPath}`);

    // Get actual duration
    const duration = await getVideoDuration(outputPath);

    return {
      file_path: outputPath,
      width: bestVideo.width,
      height: bestVideo.height,
      duration,
    };
  } catch (error) {
    // Fallback: try generic query if not already
    if (!query.includes('abstract')) {
      console.error(`Pexels download error: ${error}`);
      console.log('Trying fallback query...');
      return await searchAndDownload('abstract digital background', outputPath, apiKey, minDuration);
    }

    throw new Error(`Failed to download video: ${error}`);
  }
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
