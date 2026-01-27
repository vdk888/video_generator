/**
 * HeyGen Avatar Video Service
 * Generates AI avatar talking head videos
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import type { VideoAsset } from '../types.js';

/**
 * HeyGen API response for video generation
 */
interface HeyGenCreateResponse {
  data: {
    video_id: string;
  };
}

/**
 * HeyGen API response for video status
 */
interface HeyGenStatusResponse {
  data: {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    video_url?: string;
    error?: string;
  };
}

/**
 * Generate AI avatar video using HeyGen API
 *
 * Flow:
 * 1. Submit video generation request
 * 2. Poll status until completed
 * 3. Download video
 * 4. Normalize to 1920x1080@25fps yuv420p
 *
 * @param text - Script text for avatar to speak
 * @param outputPath - Path to save final video
 * @param apiKey - HeyGen API key
 * @param avatarId - Avatar ID (default: Angela)
 * @param voiceId - Voice ID (default: French female)
 * @returns VideoAsset with path and dimensions
 */
export async function generateAvatar(
  text: string,
  outputPath: string,
  apiKey: string,
  avatarId: string = 'Angela-inblackskirt-20220820',
  voiceId: string = '1bd001e7e50f421d891986aad5158bc8'
): Promise<VideoAsset> {
  console.log('Generating HeyGen avatar video...');
  console.log(`  Avatar: ${avatarId}`);
  console.log(`  Voice: ${voiceId}`);
  console.log(`  Text length: ${text.length} chars`);

  // Step 1: Create video generation request
  const videoId = await createVideo(text, avatarId, voiceId, apiKey);
  console.log(`  Video ID: ${videoId}`);

  // Step 2: Poll for completion
  const videoUrl = await pollVideoStatus(videoId, apiKey);
  console.log(`  Video ready: ${videoUrl}`);

  // Step 3: Download video
  const downloadPath = outputPath.replace('.mp4', '_raw.mp4');
  await downloadVideo(videoUrl, downloadPath);
  console.log(`  Downloaded: ${downloadPath}`);

  // Step 4: Normalize video to standard format
  await normalizeVideo(downloadPath, outputPath);
  console.log(`  Normalized: ${outputPath}`);

  // Clean up raw download
  try {
    await fs.unlink(downloadPath);
  } catch (error) {
    // Ignore cleanup errors
  }

  // Get video duration
  const duration = await getVideoDuration(outputPath);

  return {
    file_path: outputPath,
    width: 1920,
    height: 1080,
    duration,
  };
}

/**
 * Submit video generation request to HeyGen API
 */
async function createVideo(
  text: string,
  avatarId: string,
  voiceId: string,
  apiKey: string
): Promise<string> {
  const url = 'https://api.heygen.com/v2/video/generate';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'X-Api-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      video_inputs: [
        {
          character: {
            type: 'avatar',
            avatar_id: avatarId,
          },
          voice: {
            type: 'text',
            input_text: text,
            voice_id: voiceId,
          },
        },
      ],
      dimension: {
        width: 1920,
        height: 1080,
      },
      aspect_ratio: '16:9',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HeyGen API error (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as HeyGenCreateResponse;

  if (!data.data?.video_id) {
    throw new Error(`Unexpected HeyGen response format: ${JSON.stringify(data)}`);
  }

  return data.data.video_id;
}

/**
 * Poll HeyGen API until video generation is complete
 *
 * @param videoId - Video generation job ID
 * @param apiKey - HeyGen API key
 * @param maxWaitSeconds - Maximum wait time (default: 10 minutes)
 * @param pollInterval - Seconds between checks (default: 5 seconds)
 * @returns URL of completed video
 */
async function pollVideoStatus(
  videoId: string,
  apiKey: string,
  maxWaitSeconds: number = 600,
  pollInterval: number = 5
): Promise<string> {
  const url = 'https://api.heygen.com/v1/video_status.get';
  let elapsed = 0;

  while (elapsed < maxWaitSeconds) {
    const response = await fetch(`${url}?video_id=${videoId}`, {
      method: 'GET',
      headers: {
        'X-Api-Key': apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HeyGen status check failed (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as HeyGenStatusResponse;

    if (!data.data) {
      throw new Error(`Unexpected HeyGen status response: ${JSON.stringify(data)}`);
    }

    const status = data.data.status;

    if (status === 'completed') {
      const videoUrl = data.data.video_url;
      if (!videoUrl) {
        throw new Error('Video completed but no URL provided');
      }
      return videoUrl;
    } else if (status === 'failed') {
      const error = data.data.error || 'Unknown error';
      throw new Error(`HeyGen video generation failed: ${error}`);
    } else if (status === 'pending' || status === 'processing') {
      // Still generating, wait and poll again
      console.log(`  Status: ${status}... (${elapsed}s elapsed)`);
      await new Promise((resolve) => setTimeout(resolve, pollInterval * 1000));
      elapsed += pollInterval;
    } else {
      throw new Error(`Unknown HeyGen status: ${status}`);
    }
  }

  throw new Error(`HeyGen video generation timed out after ${maxWaitSeconds}s`);
}

/**
 * Download video from URL to local path
 */
async function downloadVideo(videoUrl: string, outputPath: string): Promise<void> {
  const response = await fetch(videoUrl);

  if (!response.ok) {
    throw new Error(`Failed to download video: status ${response.status}`);
  }

  if (!response.body) {
    throw new Error('No response body from video URL');
  }

  const fileHandle = await fs.open(outputPath, 'w');
  const writable = fileHandle.createWriteStream();

  try {
    const reader = response.body.getReader();

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
}

/**
 * Normalize video to standard format: 1920x1080@25fps yuv420p
 * Ensures compatibility with video pipeline
 */
async function normalizeVideo(inputPath: string, outputPath: string): Promise<void> {
  const args = [
    '-y', // Overwrite output
    '-i', inputPath,
    '-vf', 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black',
    '-r', '25', // 25 fps
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p', // CRITICAL for compatibility
    '-c:a', 'aac',
    '-ar', '48000', // 48kHz audio
    '-ac', '2', // Stereo
    outputPath,
  ];

  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stderr = '';
    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg normalization failed: ${stderr}`));
      }
    });

    ffmpeg.on('error', (error) => {
      reject(new Error(`FFmpeg spawn error: ${error.message}`));
    });
  });
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
