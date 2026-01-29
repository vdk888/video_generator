/**
 * KineticTypography - Big text overlay on dimmed background
 * Per VIDEO_BIBLE.md: 170pt Inter-ExtraBold, violet #667eea, dimmed bg (brightness 0.6)
 */

import React from 'react';
import {
  AbsoluteFill,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
  spring,
  useVideoConfig,
  interpolate,
  Easing,
} from 'remotion';
import { SubtitleOverlay } from './SubtitleOverlay';
import { KINETIC, FONTS, LAYOUT, SPRING_CONFIGS } from '../brand';
import type { Scene } from '../types';

export interface KineticTypographyProps {
  scene: Scene;
  highlightWord: string;
}

export const KineticTypography: React.FC<KineticTypographyProps> = ({
  scene,
  highlightWord,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Spring animation for text entrance using brand constants
  const springScale = spring({
    frame,
    fps,
    from: 0.8,
    to: 1.0,
    config: SPRING_CONFIGS.KINETIC,
  });

  const opacity = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    config: SPRING_CONFIGS.KINETIC,
  });

  // Blur-to-sharp entrance animation (first 12 frames) - bigger initial blur
  const blurAmount = interpolate(
    frame,
    [0, 12],
    [12, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  // Slide-up entrance animation (first 18 frames) - bigger movement
  const translateY = interpolate(
    frame,
    [0, 18],
    [60, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    }
  );

  // Subtle continuous pulse after settling (after frame 20) - stronger pulse, slower
  const pulse = frame > 20 ? 1 + 0.025 * Math.sin((frame - 20) * 0.06) : 1;

  // Combine all scale effects
  const finalScale = springScale * pulse;

  // Progressive background dimming and blur
  const bgBrightness = interpolate(frame, [0, 12], [1.0, KINETIC.BACKGROUND_BRIGHTNESS], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const bgBlur = interpolate(frame, [0, 15], [0, 3], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill>
      {/* Dimmed background video - progressive dimming + blur */}
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          filter: `brightness(${bgBrightness}) blur(${bgBlur}px)`,
        }}
      >
        {scene.video.file_path && (
          <OffthreadVideo
            src={staticFile(scene.video.file_path)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )}
      </div>

      {/* Audio is handled by SceneAudioTrack in BubbleVideoComposition */}

      {/* Large kinetic text overlay - all styling from brand constants */}
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            fontSize: KINETIC.FONT_SIZE,
            fontFamily: FONTS.FAMILY,
            fontWeight: KINETIC.FONT_WEIGHT,
            color: KINETIC.COLOR,
            textAlign: 'center',
            padding: `0 ${LAYOUT.PADDING_HORIZONTAL}px`,
            maxWidth: `${LAYOUT.MAX_WIDTH_PERCENT}%`,
            lineHeight: 1.1,
            letterSpacing: '-2px',
            transform: `scale(${finalScale}) translateY(${translateY}px)`,
            opacity,
            textShadow: `${KINETIC.TEXT_SHADOW}, 0 0 60px rgba(102, 126, 234, 0.3), 0 0 120px rgba(102, 126, 234, 0.15)`,
            filter: `blur(${blurAmount}px)`,
          }}
        >
          {highlightWord}
        </div>
      </AbsoluteFill>

      {/* Optional subtitles (smaller, for accessibility) */}
      {scene.audio.word_timings && scene.audio.word_timings.length > 0 && (
        <SubtitleOverlay wordTimings={scene.audio.word_timings} startFrame={0} />
      )}
    </AbsoluteFill>
  );
};
