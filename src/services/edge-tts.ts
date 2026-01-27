/**
 * Edge TTS Service
 * Free text-to-speech using Microsoft Edge browser TTS engine
 * Requires edge-tts npm package or CLI tool
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import type { AudioAsset } from '../types.js';

/**
 * Generate speech audio using Edge TTS
 *
 * Note: This requires the edge-tts CLI tool to be installed
 * Install: npm install -g edge-tts OR use edge-tts from Python
 *
 * @param text - Text to synthesize
 * @param outputPath - Path to save MP3 file
 * @param voice - Voice ID (default: French female)
 * @returns AudioAsset with file path, duration, and subtitle file
 */
export async function generateSpeech(
  text: string,
  outputPath: string,
  voice: string = 'fr-FR-VivienneMultilingualNeural'
): Promise<AudioAsset> {
  console.log(`Generating Edge TTS audio for: "${text.slice(0, 30)}..."`);

  // Generate VTT subtitle file path
  const vttPath = outputPath.replace('.mp3', '.vtt');
  const assPath = outputPath.replace('.mp3', '.ass');

  // Call edge-tts CLI to generate audio + VTT
  await generateWithEdgeTTS(text, outputPath, vttPath, voice);

  // Get audio duration
  const duration = await getAudioDuration(outputPath);

  // Convert VTT to ASS with highlighting
  await convertVttToAss(vttPath, assPath, null);

  // Clean up VTT file
  try {
    await fs.unlink(vttPath);
  } catch (error) {
    // Ignore cleanup errors
  }

  console.log(`Audio saved: ${outputPath} (${duration.toFixed(2)}s)`);

  return {
    file_path: outputPath,
    duration,
    subtitle_path: assPath,
    word_timings: null, // Could parse from VTT if needed
  };
}

/**
 * Call edge-tts CLI to generate audio and VTT subtitles
 */
async function generateWithEdgeTTS(
  text: string,
  audioPath: string,
  vttPath: string,
  voice: string
): Promise<void> {
  // Try to find edge-tts command (could be in node_modules or global)
  // For simplicity, assume it's in PATH or use npx
  const edgeTtsCommand = 'edge-tts'; // Or 'npx edge-tts'

  const args = [
    '--text', text,
    '--write-media', audioPath,
    '--write-subtitles', vttPath,
    '--voice', voice,
  ];

  return new Promise((resolve, reject) => {
    const edgeTts = spawn(edgeTtsCommand, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stderr = '';
    edgeTts.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    edgeTts.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Edge TTS failed (exit ${code}): ${stderr}`));
      }
    });

    edgeTts.on('error', (error) => {
      reject(new Error(`Edge TTS spawn error: ${error.message}`));
    });
  });
}

/**
 * Convert WebVTT subtitles to ASS format with styling
 */
async function convertVttToAss(
  vttPath: string,
  assPath: string,
  highlightWord: string | null
): Promise<void> {
  // Read VTT file
  const vttContent = await fs.readFile(vttPath, 'utf-8');
  const lines = vttContent.split('\n');

  // ASS header with Bubble styling
  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Inter,40,&H00FFFFFF,&H000000FF,&H80000000,&H80000000,-1,0,0,0,100,100,0,0,1,2,0,2,50,50,50,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const events: string[] = [];

  // Parse VTT timestamps and text
  // Format: 00:00:00.000 --> 00:00:02.500
  const timePattern = /(\d{2}):(\d{2}):(\d{2})[.,](\d{3})\s-->\s(\d{2}):(\d{2}):(\d{2})[.,](\d{3})/;

  let currentStart: string | null = null;
  let currentEnd: string | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === 'WEBVTT') continue;

    const match = timePattern.exec(trimmed);
    if (match) {
      // Parse timestamp
      const [, h1, m1, s1, ms1, h2, m2, s2, ms2] = match;

      // Convert to ASS format (H:MM:SS.CS)
      currentStart = `${parseInt(h1)}:${m1}:${s1}.${Math.floor(parseInt(ms1) / 10)
        .toString()
        .padStart(2, '0')}`;
      currentEnd = `${parseInt(h2)}:${m2}:${s2}.${Math.floor(parseInt(ms2) / 10)
        .toString()
        .padStart(2, '0')}`;
      continue;
    }

    // Text line (only if we have timestamps)
    if (currentStart && currentEnd && trimmed) {
      let displayText = trimmed;

      // Apply highlight if word is present
      if (highlightWord && trimmed.toLowerCase().includes(highlightWord.toLowerCase())) {
        const highlightAss = String.raw`{\c&Hea7e66&}`;
        const resetAss = String.raw`{\c&HFFFFFF&}`;

        // Case-insensitive replace
        const regex = new RegExp(`(${highlightWord})`, 'gi');
        displayText = displayText.replace(regex, `${highlightAss}$1${resetAss}`);
      }

      events.push(
        `Dialogue: 0,${currentStart},${currentEnd},Default,,0,0,0,,${displayText}`
      );

      // Reset for next block
      currentStart = null;
      currentEnd = null;
    }
  }

  // Write ASS file
  await fs.writeFile(assPath, header + events.join('\n'));
}

/**
 * Get audio duration using FFprobe
 */
async function getAudioDuration(filePath: string): Promise<number> {
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
