/**
 * ElevenLabs TTS Service
 * High-quality multilingual text-to-speech API
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import type { AudioAsset } from '../types.js';

/**
 * Generate speech audio using ElevenLabs TTS
 *
 * @param text - Text to synthesize
 * @param outputPath - Path to save MP3 file
 * @param apiKey - ElevenLabs API key
 * @param voiceId - Voice ID (default: Bella - French female)
 * @returns AudioAsset with file path, duration, and subtitle file
 */
export async function generateSpeech(
  text: string,
  outputPath: string,
  apiKey: string,
  voiceId: string = 'EXAVITQu4vr4xnSDxMaL'
): Promise<AudioAsset> {
  console.log(`Generating ElevenLabs audio for: "${text.slice(0, 30)}..."`);

  // 1. Call ElevenLabs API
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
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

  // 2. Stream MP3 data directly to file
  if (!response.body) {
    throw new Error('No response body from ElevenLabs');
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

  console.log(`Audio saved: ${outputPath}`);

  // 3. Get audio duration
  const duration = await getAudioDuration(outputPath);

  // 4. Generate subtitle file (ASS format)
  const subtitlePath = outputPath.replace('.mp3', '.ass');
  await generateSubtitles(text, subtitlePath, duration, null);

  return {
    file_path: outputPath,
    duration,
    subtitle_path: subtitlePath,
    word_timings: null, // ElevenLabs doesn't provide word timings
  };
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

  // Brand color for highlights (Bubble orange/violet)
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
