/**
 * AnimatedScene - Renders any registered animation based on config
 *
 * This is the main wrapper component that:
 * 1. Looks up the animation type in the registry
 * 2. Renders the appropriate animation component
 * 3. Provides consistent background and layout
 *
 * Usage in script.json:
 * {
 *   "type": "speech",
 *   "text": "100 millions d'utilisateurs en deux mois.",
 *   "scene_type": "animated",
 *   "animation": {
 *     "type": "counter",
 *     "params": { "start": 0, "end": 100000000, "format": "millions" }
 *   }
 * }
 */

import React from 'react';
import {
  AbsoluteFill,
  useVideoConfig,
  useCurrentFrame,
  interpolate,
} from 'remotion';
import { SubtitleOverlay } from './SubtitleOverlay';
import { getAnimationComponent, isValidAnimationType } from './animations';
import type { AnimationConfig } from './animations/types';
import type { Scene } from '../types';
import { COLORS } from '../brand';

export interface AnimatedSceneProps {
  scene: Scene;
  animation: AnimationConfig;
}

export const AnimatedScene: React.FC<AnimatedSceneProps> = ({
  scene,
  animation,
}) => {
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();

  // Validate animation type
  if (!animation || !isValidAnimationType(animation.type)) {
    console.error(`Invalid animation type: ${animation?.type}`);
    return (
      <AbsoluteFill style={{ backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ color: 'white', fontSize: 32 }}>
          Animation Error: Unknown type "{animation?.type}"
        </div>
      </AbsoluteFill>
    );
  }

  // Get the animation component
  const AnimationComponent = getAnimationComponent(animation.type);

  if (!AnimationComponent) {
    return (
      <AbsoluteFill style={{ backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ color: 'white', fontSize: 32 }}>
          Animation not found: {animation.type}
        </div>
      </AbsoluteFill>
    );
  }

  // Background gradient animation
  const bgProgress = interpolate(frame, [0, durationInFrames], [0, 1]);
  const bgHue = interpolate(bgProgress, [0, 1], [230, 250]); // Subtle hue shift

  return (
    <AbsoluteFill>
      {/* Animated gradient background */}
      <AbsoluteFill
        style={{
          background: `
            radial-gradient(ellipse at 30% 20%, hsla(${bgHue}, 60%, 25%, 1) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 80%, hsla(${bgHue + 20}, 50%, 20%, 1) 0%, transparent 50%),
            linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 50%, #0f0f1a 100%)
          `,
        }}
      />

      {/* Subtle grid pattern overlay */}
      <AbsoluteFill
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          opacity: 0.5,
        }}
      />

      {/* Vignette */}
      <AbsoluteFill
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Animation component */}
      <AbsoluteFill>
        <AnimationComponent
          {...animation.params}
          durationInFrames={durationInFrames}
          delayFrames={0}
        />
      </AbsoluteFill>

      {/* Audio is handled by SceneAudioTrack in BubbleVideoComposition */}

      {/* Subtitles overlay */}
      {scene.audio.word_timings && scene.audio.word_timings.length > 0 && (
        <SubtitleOverlay wordTimings={scene.audio.word_timings} startFrame={0} />
      )}
    </AbsoluteFill>
  );
};
