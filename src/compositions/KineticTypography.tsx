/**
 * KineticTypography - Big text overlay on dimmed background
 * Per VIDEO_BIBLE.md: 170pt Inter-ExtraBold, violet #667eea, dimmed bg (brightness 0.6)
 */

import React from 'react';
import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
  spring,
  useVideoConfig,
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
  const scale = spring({
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

  return (
    <AbsoluteFill>
      {/* Dimmed background video - using brand constant for brightness */}
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          filter: `brightness(${KINETIC.BACKGROUND_BRIGHTNESS})`,
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

      {/* Voiceover audio */}
      {scene.audio.file_path && (
        <Audio src={staticFile(scene.audio.file_path)} />
      )}

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
            transform: `scale(${scale})`,
            opacity,
            textShadow: KINETIC.TEXT_SHADOW,
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
