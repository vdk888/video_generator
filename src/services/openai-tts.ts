/**
 * OpenAI TTS Service (via OpenRouter)
 * Generates high-quality speech audio with subtitle files
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import type { AudioAsset } from '../types.js';

/**
 * OpenRouter audio API response (streamed chunks)
 */
interface AudioChunk {
  choices?: Array<{
    delta?: {
      audio?: {
        data?: string; // base64 encoded PCM16
      };
    };
  }>;
}

/**
 * Generate speech audio using OpenAI TTS via OpenRouter
 *
 * @param text - Text to synthesize
 * @param outputPath - Path to save MP3 file
 * @param apiKey - OpenRouter API key
 * @param voice - Voice ID (default: 'alloy')
 * @returns AudioAsset with file path, duration, and subtitle file
 */
export async function generateSpeech(
  text: string,
  outputPath: string,
  apiKey: string,
  voice: string = 'alloy'
): Promise<AudioAsset> {
  console.log(`Generating OpenAI TTS audio for: "${text.slice(0, 30)}..."`);

  // 1. Call OpenRouter streaming audio API
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://bubble-video-engine.local',
      'X-Title': 'Bubble Video Engine',
    },
    body: JSON.stringify({
      model: 'openai/gpt-audio-mini',
      modalities: ['text', 'audio'],
      audio: {
        voice: voice,
        format: 'pcm16',
      },
      messages: [{ role: 'user', content: text }],
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI TTS API error (${response.status}): ${errorText}`);
  }

  // 2. Stream and collect audio chunks
  const audioBuffer: Buffer[] = [];

  if (!response.body) {
    throw new Error('No response body from OpenAI TTS');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Parse SSE chunks (format: "data: {...}\n\n")
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6); // Remove "data: " prefix
          if (jsonStr.trim() === '[DONE]') continue;

          try {
            const data = JSON.parse(jsonStr) as AudioChunk;
            const audioData = data.choices?.[0]?.delta?.audio?.data;

            if (audioData) {
              // Decode base64 to binary
              const binaryData = Buffer.from(audioData, 'base64');
              audioBuffer.push(binaryData);
            }
          } catch (error) {
            // Skip invalid JSON chunks
            continue;
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  if (audioBuffer.length === 0) {
    throw new Error('No audio data received from API');
  }

  // 3. Combine chunks and save as raw PCM
  const rawPcmBuffer = Buffer.concat(audioBuffer);
  const rawPath = `${outputPath}.pcm`;
  await fs.writeFile(rawPath, rawPcmBuffer);

  // 4. Convert PCM16 to MP3 using FFmpeg
  // OpenAI TTS returns: PCM16 LE, 24kHz, Mono
  // Project standard: 48kHz, Stereo, MP3
  await convertPcmToMp3(rawPath, outputPath);

  // Clean up raw PCM file
  await fs.unlink(rawPath);

  // 5. Get audio duration
  const duration = await getAudioDuration(outputPath);

  // 6. Generate subtitle file (ASS format)
  const subtitlePath = outputPath.replace('.mp3', '.ass');
  await generateSubtitles(text, subtitlePath, duration, null);

  console.log(`Audio saved: ${outputPath} (${duration.toFixed(2)}s)`);

  return {
    file_path: outputPath,
    duration,
    subtitle_path: subtitlePath,
    word_timings: null, // OpenAI TTS doesn't provide word timings yet
  };
}

/**
 * Convert raw PCM16 audio to MP3 using FFmpeg
 */
async function convertPcmToMp3(inputPath: string, outputPath: string): Promise<void> {
  const args = [
    '-y', // Overwrite output
    '-f', 's16le', // PCM16 little-endian
    '-ar', '24000', // 24kHz sample rate
    '-ac', '1', // Mono
    '-i', inputPath,
    '-ar', '48000', // Resample to 48kHz
    '-ac', '2', // Convert to stereo
    '-b:a', '192k', // 192kbps bitrate
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
        reject(new Error(`FFmpeg conversion failed: ${stderr}`));
      }
    });

    ffmpeg.on('error', (error) => {
      reject(new Error(`FFmpeg spawn error: ${error.message}`));
    });
  });
}

/**
 * Get audio duration using FFprobe
 */
async function getAudioDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
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
        resolve(isNaN(duration) ? 3.0 : duration);
      } else {
        resolve(3.0); // Fallback duration
      }
    });

    ffprobe.on('error', () => {
      resolve(3.0); // Fallback duration
    });
  });
}

/**
 * Generate ASS subtitle file with text chunking
 * Splits text into ~40 character chunks with proportional timing
 */
async function generateSubtitles(
  text: string,
  outputPath: string,
  duration: number,
  highlightWord: string | null
): Promise<void> {
  // 1. Split text into chunks (max ~40 chars)
  const words = text.split(' ');
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentLen = 0;

  for (const word of words) {
    if (currentLen + word.length > 40 && currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));
      currentChunk = [word];
      currentLen = word.length;
    } else {
      currentChunk.push(word);
      currentLen += word.length + 1;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }

  // 2. Distribute duration proportionally
  const totalChars = text.length || 1;
  const chunkTimings: Array<[number, number, string]> = [];
  let currentStart = 0.0;

  for (const chunk of chunks) {
    const ratio = chunk.length / totalChars;
    const chunkDuration = duration * ratio;
    chunkTimings.push([currentStart, currentStart + chunkDuration, chunk]);
    currentStart += chunkDuration;
  }

  // 3. Generate ASS file
  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 1

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Inter,60,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,2,0,2,10,10,50,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const lines: string[] = [header];

  const highlightAss = String.raw`{\c&Hea7e66&}`;
  const resetAss = String.raw`{\c&HFFFFFF&}`;

  for (const [startSec, endSec, chunkText] of chunkTimings) {
    let displayText = chunkText;

    // Apply highlight if word is in this chunk
    if (highlightWord && chunkText.includes(highlightWord)) {
      displayText = chunkText.replace(
        highlightWord,
        `${highlightAss}${highlightWord}${resetAss}`
      );
    }

    const startTime = formatAssTime(startSec);
    const endTime = formatAssTime(endSec);

    lines.push(
      `Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${displayText}`
    );
  }

  await fs.writeFile(outputPath, lines.join('\n'));
}

/**
 * Format seconds to ASS timestamp (H:MM:SS.CS)
 */
function formatAssTime(seconds: number): string {
  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const secs = Math.floor(seconds % 60);
  const centiseconds = Math.floor((seconds % 1) * 100);

  return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
}
