/**
 * Music Service
 * Selects background music tracks from local library organized by mood
 */

import { promises as fs } from 'fs';
import * as path from 'path';

/**
 * Supported audio file extensions
 */
const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.aac', '.ogg'];

/**
 * Select a background music track from local library
 *
 * Music files should be organized as: {assetsDir}/{mood}/{track}.mp3
 *
 * Example:
 *   assets/music/ambient_cinematic/track1.mp3
 *   assets/music/upbeat/track1.mp3
 *
 * @param mood - Music mood (e.g., "ambient_cinematic", "upbeat", "dramatic")
 * @param assetsDir - Base assets directory (default: "assets")
 * @returns Path to selected track, or null if none found
 */
export async function selectTrack(
  mood: string,
  assetsDir: string = 'assets'
): Promise<string | null> {
  const musicDir = path.join(assetsDir, 'music');
  const moodDir = path.join(musicDir, mood);

  // Check if mood directory exists
  try {
    const stats = await fs.stat(moodDir);
    if (!stats.isDirectory()) {
      console.warn(`Music mood path exists but is not a directory: ${moodDir}`);
      return null;
    }
  } catch (error) {
    console.warn(`No music directory found for mood "${mood}": ${moodDir}`);
    return null;
  }

  // Find all audio files in mood directory
  try {
    const files = await fs.readdir(moodDir);

    const audioFiles = files.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return AUDIO_EXTENSIONS.includes(ext);
    });

    if (audioFiles.length === 0) {
      console.warn(`No audio files found in ${moodDir}`);
      return null;
    }

    // Select first track (future: random selection, rotation)
    const selectedTrack = path.join(moodDir, audioFiles[0]);
    console.log(`Selected music track: ${audioFiles[0]} (mood: ${mood})`);

    return selectedTrack;
  } catch (error) {
    console.error(`Error reading music directory ${moodDir}:`, error);
    return null;
  }
}

/**
 * List all available music moods (subdirectories in music directory)
 *
 * @param assetsDir - Base assets directory (default: "assets")
 * @returns Array of mood names
 */
export async function listAvailableMoods(
  assetsDir: string = 'assets'
): Promise<string[]> {
  const musicDir = path.join(assetsDir, 'music');

  try {
    const files = await fs.readdir(musicDir, { withFileTypes: true });

    return files
      .filter((dirent) => dirent.isDirectory() && !dirent.name.startsWith('.'))
      .map((dirent) => dirent.name);
  } catch (error) {
    console.warn(`Music directory not found: ${musicDir}`);
    return [];
  }
}

/**
 * Get all tracks for a specific mood
 *
 * @param mood - Music mood name
 * @param assetsDir - Base assets directory (default: "assets")
 * @returns Array of track file paths
 */
export async function getTracksForMood(
  mood: string,
  assetsDir: string = 'assets'
): Promise<string[]> {
  const musicDir = path.join(assetsDir, 'music');
  const moodDir = path.join(musicDir, mood);

  try {
    const files = await fs.readdir(moodDir);

    const audioFiles = files
      .filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return AUDIO_EXTENSIONS.includes(ext);
      })
      .map((file) => path.join(moodDir, file));

    return audioFiles;
  } catch (error) {
    console.warn(`No tracks found for mood "${mood}": ${moodDir}`);
    return [];
  }
}
