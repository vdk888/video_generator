/**
 * Video utilities
 * Extract video metadata using FFprobe
 */

import { spawn } from 'child_process';

/**
 * Get video duration using FFprobe
 *
 * @param filePath - Path to video file (MP4, MOV, etc.)
 * @returns Duration in seconds
 */
export async function getVideoDuration(filePath: string): Promise<number> {
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
 * Get video dimensions using FFprobe
 *
 * @param filePath - Path to video file
 * @returns Object with width and height
 */
export async function getVideoDimensions(
  filePath: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn('ffprobe', [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height',
      '-of', 'csv=s=x:p=0',
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
        const [width, height] = stdout.trim().split('x').map(Number);
        if (isNaN(width) || isNaN(height)) {
          reject(new Error(`Invalid dimensions from ffprobe: ${stdout}`));
        } else {
          resolve({ width, height });
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
 * Get video frame rate using FFprobe
 *
 * @param filePath - Path to video file
 * @returns Frame rate in FPS
 */
export async function getVideoFrameRate(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn('ffprobe', [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=r_frame_rate',
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
        // Parse "25/1" format
        const [num, denom] = stdout.trim().split('/').map(Number);
        if (isNaN(num) || isNaN(denom) || denom === 0) {
          reject(new Error(`Invalid frame rate from ffprobe: ${stdout}`));
        } else {
          resolve(num / denom);
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
