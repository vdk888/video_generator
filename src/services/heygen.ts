/**
 * HeyGen Avatar Video Service
 * Generates AI avatar talking head videos
 * Uses ElevenLabs audio as voice input for proper French pronunciation
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
    status: string;
    video_url?: string;
    error?: unknown;
  };
}

/**
 * Generate AI avatar video using HeyGen API with ElevenLabs audio
 *
 * Flow:
 * 1. Generate audio with ElevenLabs
 * 2. Upload audio to HeyGen
 * 3. Create video with audio input
 * 4. Poll status until completed
 * 5. Download and normalize video
 */
export async function generateAvatar(
  text: string,
  outputPath: string,
  heygenApiKey: string,
  avatarId: string,
  audioUrl: string,
): Promise<VideoAsset> {
  console.log('Generating HeyGen avatar video...');
  console.log(`  Avatar: ${avatarId}`);
  console.log(`  Audio: ElevenLabs`);
  console.log(`  Text length: ${text.length} chars`);

  // Step 1: Create video with audio URL
  const videoId = await createVideoWithAudio(avatarId, audioUrl, heygenApiKey);
  console.log(`  Video ID: ${videoId}`);

  // Step 2: Poll for completion
  const videoUrl = await pollVideoStatus(videoId, heygenApiKey);
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
  } catch {
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
 * Generate ElevenLabs audio and upload to HeyGen
 * Returns the HeyGen-hosted audio URL
 */
export async function generateAndUploadAudio(
  text: string,
  audioPath: string,
  elevenlabsApiKey: string,
  elevenlabsVoiceId: string,
  heygenApiKey: string,
): Promise<string> {
  // 1. Generate audio with ElevenLabs
  console.log(`  Generating ElevenLabs audio (${elevenlabsVoiceId})...`);

  // Check audio cache
  let needsGenerate = true;
  try {
    const stats = await fs.stat(audioPath);
    if (stats.size > 1000) {
      console.log(`  ✅ Cached ElevenLabs audio`);
      needsGenerate = false;
    }
  } catch { /* not cached */ }

  if (needsGenerate) {
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${elevenlabsVoiceId}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': elevenlabsApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_v3',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs API error (${response.status}): ${errorText}`);
    }

    if (!response.body) throw new Error('No response body from ElevenLabs');

    const fileHandle = await fs.open(audioPath, 'w');
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
    console.log(`  ✅ ElevenLabs audio generated`);
  }

  // 2. Upload raw binary to HeyGen
  console.log(`  Uploading audio to HeyGen...`);
  const audioBuffer = await fs.readFile(audioPath);

  const uploadResponse = await fetch('https://upload.heygen.com/v1/asset', {
    method: 'POST',
    headers: {
      'X-Api-Key': heygenApiKey,
      'Content-Type': 'audio/mpeg',
    },
    body: audioBuffer,
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    throw new Error(`HeyGen upload error (${uploadResponse.status}): ${errorText}`);
  }

  const uploadData = await uploadResponse.json() as Record<string, unknown>;
  // Response can be { url: "..." } or { data: { url: "..." } }
  const audioUrl = (uploadData as any).url || (uploadData as any).data?.url;
  if (!audioUrl) {
    throw new Error(`HeyGen upload: no URL returned: ${JSON.stringify(uploadData)}`);
  }

  console.log(`  ✅ Audio uploaded to HeyGen`);
  return audioUrl;
}

/**
 * Submit video generation request to HeyGen API with audio input
 */
async function createVideoWithAudio(
  avatarId: string,
  audioUrl: string,
  apiKey: string,
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
            type: 'audio',
            audio_url: audioUrl,
          },
        },
      ],
      dimension: {
        width: 1280,
        height: 720,
      },
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

    const rawData = await response.json();
    const data = rawData as HeyGenStatusResponse;

    if (!data.data) {
      throw new Error(`Unexpected HeyGen status response: ${JSON.stringify(rawData)}`);
    }

    const status = data.data.status;

    if (status !== 'pending' && status !== 'processing' && status !== 'waiting') {
      console.log(`  HeyGen response (${status}): ${JSON.stringify(rawData).slice(0, 500)}`);
    }

    if (status === 'completed') {
      const videoUrl = data.data.video_url;
      if (!videoUrl) {
        throw new Error('Video completed but no URL provided');
      }
      return videoUrl;
    } else if (status === 'failed') {
      const error = data.data.error
        ? (typeof data.data.error === 'string' ? data.data.error : JSON.stringify(data.data.error))
        : 'Unknown error';
      throw new Error(`HeyGen video generation failed: ${error}`);
    } else if (status === 'pending' || status === 'processing' || status === 'waiting') {
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
 */
async function normalizeVideo(inputPath: string, outputPath: string): Promise<void> {
  const args = [
    '-y',
    '-i', inputPath,
    '-vf', 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black',
    '-r', '25',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-ar', '48000',
    '-ac', '2',
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
        resolve(5.0);
      }
    });

    ffprobe.on('error', () => {
      resolve(5.0);
    });
  });
}
