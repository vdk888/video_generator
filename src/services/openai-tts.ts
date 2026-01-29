/**
 * OpenAI TTS Service (Direct API)
 * Uses the /v1/audio/speech endpoint for fast, precise text-to-speech
 * Model: gpt-4o-mini-tts (supports voice direction via instructions)
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import type { AudioAsset } from '../types.js';

/**
 * Voice direction instructions for energetic French narration
 */
const VOICE_INSTRUCTIONS = `Voice: Energetic French tech YouTuber narrating a fast-paced video.
Tone: Confident, masculine, enthusiastic — genuinely excited about the topic.
Delivery: Vary pace naturally. Punch key words harder. Speed through transitions.
Style: Dynamic video narration, NOT a podcast or interview. Short impactful pauses after punchy statements.
Language: Natural French intonation and rhythm. Accessible, not academic.`;

/**
 * Generate speech audio using OpenAI's direct TTS API
 *
 * @param text - Text to synthesize
 * @param outputPath - Path to save MP3 file
 * @param apiKey - OpenAI API key (direct, not OpenRouter)
 * @param voice - Voice ID (default: 'onyx' — deep masculine)
 * @returns AudioAsset with file path and duration
 */
export async function generateSpeech(
  text: string,
  outputPath: string,
  apiKey: string,
  voice: string = 'onyx'
): Promise<AudioAsset> {
  console.log(`  Generating TTS (${voice}): "${text.slice(0, 40)}..."`);

  // Check cache
  try {
    const stats = await fs.stat(outputPath);
    if (stats.size > 1000) {
      const duration = await getAudioDuration(outputPath);
      if (duration > 0.3) {
        console.log(`  ✅ Cached audio: ${duration.toFixed(1)}s`);
        return { file_path: outputPath, duration, subtitle_path: null, word_timings: null };
      }
    }
  } catch { /* not cached */ }

  // Use OpenAI direct /v1/audio/speech endpoint
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini-tts',
      input: text,
      voice: voice,
      instructions: VOICE_INSTRUCTIONS,
      response_format: 'mp3',
      speed: 1.1, // Slightly faster for energy
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI TTS API error (${response.status}): ${errorText}`);
  }

  if (!response.body) throw new Error('No response body from TTS API');

  // Stream MP3 directly to file
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

  // Get audio duration
  const duration = await getAudioDuration(outputPath);

  // Generate subtitle file
  const subtitlePath = outputPath.replace('.mp3', '.ass');
  await generateSubtitles(text, subtitlePath, duration, null);

  console.log(`  ✅ Audio: ${duration.toFixed(1)}s`);

  return {
    file_path: outputPath,
    duration,
    subtitle_path: subtitlePath,
    word_timings: null,
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
