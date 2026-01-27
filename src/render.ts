/**
 * Remotion rendering wrapper
 * Handles bundling and rendering of Remotion compositions
 */

import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import { fileURLToPath } from 'url';
import type { BubbleVideoInputProps } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Render video using Remotion
 *
 * @param inputProps - Props for BubbleVideo composition
 * @param outputPath - Path to save rendered MP4
 * @param onProgress - Optional progress callback
 * @returns Path to rendered video
 */
export async function renderVideo(
  inputProps: BubbleVideoInputProps,
  outputPath: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  console.log('\n📦 Bundling Remotion project...');

  // Bundle the Remotion project
  const bundleLocation = await bundle({
    entryPoint: path.resolve(__dirname, 'index.ts'),
    webpackOverride: (config) => config,
  });

  console.log('✅ Bundle created');
  console.log('\n🎬 Selecting composition...');

  // Select the composition
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: 'BubbleVideo',
    inputProps: inputProps as unknown as Record<string, unknown>,
  });

  console.log('✅ Composition selected');
  console.log(`   ID: ${composition.id}`);
  console.log(`   Resolution: ${composition.width}x${composition.height}`);
  console.log(`   FPS: ${composition.fps}`);
  console.log(
    `   Duration: ${composition.durationInFrames} frames (${(composition.durationInFrames / composition.fps).toFixed(2)}s)`
  );

  console.log('\n🎥 Rendering video...');
  console.log(`   Output: ${outputPath}`);
  console.log(`   Codec: H.264`);
  console.log(`   Audio: AAC`);

  // Render the video
  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: 'h264',
    outputLocation: outputPath,
    inputProps: inputProps as unknown as Record<string, unknown>,
    onProgress: ({ progress }) => {
      process.stdout.write(`\r   Progress: ${(progress * 100).toFixed(1)}%`);
      if (onProgress) {
        onProgress(progress);
      }
    },
    // H.264 encoding settings
    videoBitrate: '5M',
    audioBitrate: '192k',
    // Match VIDEO_BIBLE.md settings
    pixelFormat: 'yuv420p',
  });

  console.log('\n✅ Video rendered successfully!');
  return outputPath;
}

/**
 * Get estimated render time
 * This is a rough heuristic based on video duration
 *
 * @param durationInSeconds - Video duration in seconds
 * @returns Estimated render time in seconds
 */
export function estimateRenderTime(durationInSeconds: number): number {
  // Rough estimate: 2-3x realtime for 1080p H.264
  // This varies widely based on system specs and complexity
  return durationInSeconds * 2.5;
}
