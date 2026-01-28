/**
 * BRollScene - B-roll scene with voiceover and optional subtitles
 * Per VIDEO_BIBLE.md: Video fills 1920x1080, audio voiceover, subtitle overlay
 */

import React from 'react';
import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  staticFile,
  useVideoConfig,
  useCurrentFrame,
  interpolate,
} from 'remotion';
import { SubtitleOverlay } from './SubtitleOverlay';
import { BROLL } from '../brand';
import type { Scene } from '../types';

export interface BRollSceneProps {
  scene: Scene;
}

export const BRollScene: React.FC<BRollSceneProps> = ({ scene }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();

  // Determine Ken Burns direction based on scene text length (simple hash)
  const isEvenDirection = (scene.script_line.text.length % 2) === 0;

  // Ken Burns effect - alternate direction per scene for visual variety
  // Even: zoom out (1.12→1.0) + pan left (0→-30px)
  // Odd: zoom in (1.0→1.12) + pan right (0→+20px)
  const scale = interpolate(
    frame,
    [0, durationInFrames],
    isEvenDirection
      ? [BROLL.KEN_BURNS_SCALE_START, BROLL.KEN_BURNS_SCALE_END]
      : [BROLL.KEN_BURNS_SCALE_END, BROLL.KEN_BURNS_SCALE_START]
  );
  const translateX = interpolate(
    frame,
    [0, durationInFrames],
    isEvenDirection
      ? [0, -BROLL.KEN_BURNS_TRANSLATE_MAX]
      : [0, BROLL.KEN_BURNS_TRANSLATE_MAX * 0.67] // 20px for right pan
  );

  // Scene entrance: brief brightness flash (first 8 frames)
  const entranceBrightness = interpolate(frame, [0, 8], [1.3, BROLL.BRIGHTNESS], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill>
      {/* Ken Burns wrapper - overflow hidden for zoom/pan effect */}
      {scene.video.file_path && (
        <div
          style={{
            width: '100%',
            height: '100%',
            overflow: 'hidden',
          }}
        >
          <OffthreadVideo
            src={staticFile(scene.video.file_path)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: `scale(${scale}) translate3d(${translateX}px, 0, 0)`,
              filter: `contrast(${BROLL.CONTRAST}) saturate(${BROLL.SATURATION}) brightness(${entranceBrightness})`,
            }}
          />
          {/* Vignette overlay - darkens edges for better subtitle readability */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,${BROLL.VIGNETTE_OPACITY}) 100%)`,
              pointerEvents: 'none',
            }}
          />
        </div>
      )}

      {/* Voiceover audio with fade-out */}
      {scene.audio.file_path && (
        <Audio
          src={staticFile(scene.audio.file_path)}
          volume={(f) => {
            const sceneDurationFrames = Math.ceil(scene.audio.duration * fps);
            const fadeOutStart = Math.max(0, sceneDurationFrames - 5);
            return interpolate(f, [fadeOutStart, sceneDurationFrames], [1, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
          }}
        />
      )}

      {/* Subtitles overlay */}
      {scene.audio.word_timings && scene.audio.word_timings.length > 0 && (
        <SubtitleOverlay wordTimings={scene.audio.word_timings} startFrame={0} />
      )}
    </AbsoluteFill>
  );
};
