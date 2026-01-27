/**
 * Audio utilities
 * Extract audio metadata using FFprobe
 */

import { spawn } from 'child_process';

/**
 * Get audio duration using FFprobe
 *
 * @param filePath - Path to audio file (MP3, WAV, AAC, etc.)
 * @returns Duration in seconds
 */
export async function getAudioDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      filePath,
    ]);

    let stdout = '';
    let stderr = '';

    ffprobe.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    ffprobe.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ffprobe.on('close', (code) => {
      if (code === 0) {
        const duration = parseFloat(stdout.trim());
        if (isNaN(duration)) {
          reject(new Error(`Invalid duration from ffprobe: ${stdout}`));
        } else {
          resolve(duration);
        }
      } else {
        reject(new Error(`FFprobe failed (exit ${code}): ${stderr}`));
      }
    });

    ffprobe.on('error', (error) => {
      reject(new Error(`FFprobe spawn error: ${error.message}`));
    });
  });
}

/**
 * Get audio sample rate using FFprobe
 *
 * @param filePath - Path to audio file
 * @returns Sample rate in Hz
 */
export async function getAudioSampleRate(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn('ffprobe', [
      '-v', 'error',
      '-show_entries', 'stream=sample_rate',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      filePath,
    ]);

    let stdout = '';
    let stderr = '';

    ffprobe.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    ffprobe.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ffprobe.on('close', (code) => {
      if (code === 0) {
        const sampleRate = parseInt(stdout.trim(), 10);
        if (isNaN(sampleRate)) {
          reject(new Error(`Invalid sample rate from ffprobe: ${stdout}`));
        } else {
          resolve(sampleRate);
        }
      } else {
        reject(new Error(`FFprobe failed (exit ${code}): ${stderr}`));
      }
    });

    ffprobe.on('error', (error) => {
      reject(new Error(`FFprobe spawn error: ${error.message}`));
    });
  });
}
