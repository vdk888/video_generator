/**
 * Remotion Root - Composition registration
 * Registers the main BubbleVideo composition with dynamic metadata
 * Loads Inter font per Charte Graphique
 */

import React from 'react';
import { Composition, staticFile } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { BubbleVideo } from './BubbleVideo';
import type { BubbleVideoInputProps, BubbleVideoMetadata } from './types';

// Load Inter font with required weights per Charte Graphique
const { fontFamily } = loadFont();

// Export for use in compositions
export { fontFamily as INTER_FONT_FAMILY };

/**
 * Default input props for preview in Remotion Studio
 * Hardcoded defaults so we don't import Node.js-only config module
 */
const defaultInputProps: BubbleVideoInputProps = {
  scenes: [],
  logo_path: null,
  intro_video_path: null,
  outro_video_path: null,
  background_music_path: null,
  music_volume: -20,
  config: {
    assets_dir: 'assets',
    final_video_path: 'final_output.mp4',
    music_dir: 'assets/music',
    pexels_api_key: '',
    openrouter_api_key: '',
    openrouter_model: 'gpt-4o-mini',
    tts_provider: 'openai',
    heygen_default_avatar_id: 'Angela-inblackskirt-20220820',
    heygen_default_voice_id: '1bd001e7e50f421d891986aad5158bc8',
    enable_background_music: true,
    music_mood: 'ambient_cinematic',
    logo_path: null,
    intro_video_path: null,
    outro_video_path: null,
    timing: {
      intro_duration: [3, 5],
      hook_duration: [10, 30],
      title_card_duration: [2, 3],
      speech_segment_duration: [4, 8],
      highlight_duration: [2, 3],
      recap_duration: [10, 15],
      outro_duration: [3, 5],
      total_target: [180, 480],
      words_per_minute: 150,
      transition_duration: 0.4,
    },
    visual: {
      resolution: [1920, 1080],
      framerate: 25,
      pixel_format: 'yuv420p',
      colors: { primary: '#FFFFFF', secondary: '#000000', accent: '#667eea' },
      fonts: { title: 'Inter-ExtraBold', subtitle: 'Inter', kinetic: 'Inter-ExtraBold' },
      kinetic_typography: { font_size: 170, background_dim: -0.4, frequency: 0.2 },
    },
    audio: {
      tts_provider: 'openai',
      tts_voice: 'alloy',
      sample_rate: 48000,
      channels: 2,
      background_music_volume: -20,
      music_style: 'ambient_cinematic',
    },
  },
};

/**
 * Fetch saved props from public/props.json (written by orchestrator after render)
 * Returns null if file doesn't exist or is invalid
 */
async function loadSavedProps(): Promise<BubbleVideoInputProps | null> {
  try {
    const url = staticFile('props.json');
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    if (data && Array.isArray(data.scenes)) {
      return data as BubbleVideoInputProps;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Calculate metadata dynamically based on scenes
 * If default props have no scenes, attempts to load from props.json
 */
const calculateBubbleMetadata = async ({
  props,
}: {
  props: BubbleVideoInputProps;
}): Promise<BubbleVideoMetadata & { props: BubbleVideoInputProps }> => {
  // If no scenes in default props, try loading from saved props.json
  let resolvedProps = props;
  if (!props.scenes || props.scenes.length === 0) {
    const saved = await loadSavedProps();
    if (saved) {
      resolvedProps = saved;
    }
  }

  const { scenes, config } = resolvedProps;
  const { visual, timing } = config;

  const introDuration = timing.intro_duration[0];
  const outroDuration = timing.outro_duration[0];

  let scenesDurationSeconds = 0;
  if (scenes && scenes.length > 0) {
    scenesDurationSeconds = scenes.reduce(
      (acc, scene) => acc + scene.audio.duration,
      0
    );
  }

  const totalDurationSeconds = introDuration + scenesDurationSeconds + outroDuration;
  const durationInFrames = Math.max(1, Math.ceil(totalDurationSeconds * visual.framerate));

  return {
    durationInFrames,
    fps: visual.framerate,
    width: visual.resolution[0],
    height: visual.resolution[1],
    props: resolvedProps,
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
        calculateMetadata={calculateBubbleMetadata as any}
        defaultProps={defaultInputProps as any}
      />
    </>
  );
};
