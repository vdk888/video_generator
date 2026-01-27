/**
 * Remotion Root - Composition registration
 * Registers the main BubbleVideo composition with dynamic metadata
 * Loads Inter font per Charte Graphique
 */

import React from 'react';
import { Composition } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { BubbleVideo } from './BubbleVideo';
import { loadConfig } from './config';
import type { BubbleVideoInputProps, BubbleVideoMetadata } from './types';

// Load Inter font with required weights per Charte Graphique
// Weights: 400 (Regular), 600 (SemiBold), 700 (Bold), 800 (ExtraBold)
const { fontFamily } = loadFont();

// Ensure the font is loaded globally
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');`;
  document.head.appendChild(style);
}

// Export for use in compositions
export { fontFamily as INTER_FONT_FAMILY };

// Load default configuration
const defaultConfig = loadConfig('default');

/**
 * Default input props for preview in Remotion Studio
 */
const defaultInputProps: BubbleVideoInputProps = {
  scenes: [],
  logo_path: defaultConfig.logo_path,
  intro_video_path: defaultConfig.intro_video_path,
  outro_video_path: defaultConfig.outro_video_path,
  background_music_path: null,
  music_volume: defaultConfig.audio.background_music_volume,
  config: defaultConfig,
};

/**
 * Calculate metadata dynamically based on scenes
 * This allows video duration to be determined by actual content
 */
export const calculateMetadata = (
  props: BubbleVideoInputProps
): BubbleVideoMetadata => {
  const { scenes, config } = props;
  const { visual, timing } = config;

  // Calculate intro and outro durations
  const introDuration = timing.intro_duration[0]; // Use minimum from range
  const outroDuration = timing.outro_duration[0]; // Use minimum from range

  // Calculate total duration from scenes
  let scenesDurationSeconds = 0;
  if (scenes && scenes.length > 0) {
    scenesDurationSeconds = scenes.reduce(
      (acc, scene) => acc + scene.audio.duration,
      0
    );

    // Add transition durations between scenes
    // Each transition adds 0.4s, but overlaps with scene content
    // TransitionSeries handles this internally, but we don't subtract here
    // as transitions are part of scene duration
  }

  // Total = intro + scenes + outro
  const totalDurationSeconds = introDuration + scenesDurationSeconds + outroDuration;

  const durationInFrames = Math.ceil(totalDurationSeconds * visual.framerate);

  return {
    durationInFrames,
    fps: visual.framerate,
    width: visual.resolution[0],
    height: visual.resolution[1],
  };
};

/**
 * Root component - registers all Remotion compositions
 */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="BubbleVideo"
        component={BubbleVideo as any}
        // Dynamic metadata calculation
        calculateMetadata={({ props }) => {
          const metadata = calculateMetadata(props as unknown as BubbleVideoInputProps);
          return {
            durationInFrames: metadata.durationInFrames,
            fps: metadata.fps,
            width: metadata.width,
            height: metadata.height,
          };
        }}
        defaultProps={defaultInputProps as any}
      />
    </>
  );
};
