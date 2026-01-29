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
  spring,
  Easing,
} from 'remotion';
import { SubtitleOverlay } from './SubtitleOverlay';
import { HighlightFlash } from './HighlightFlash';
import { BROLL, HIGHLIGHT_EFFECTS } from '../brand';
import type { Scene, WordTiming } from '../types';

/**
 * Find when highlight word is spoken (for zoom punch sync)
 */
function findHighlightTime(
  highlightWord: string,
  wordTimings: WordTiming[] | null | undefined,
): number | null {
  if (!wordTimings || wordTimings.length === 0) return null;

  const needle = highlightWord.toLowerCase();
  const needleWords = needle.split(/\s+/);

  // Multi-word phrase
  if (needleWords.length > 1) {
    for (let i = 0; i <= wordTimings.length - needleWords.length; i++) {
      let allMatch = true;
      for (let j = 0; j < needleWords.length; j++) {
        const clean = wordTimings[i + j].word.replace(/[.,!?;:'\"()]/g, '').toLowerCase();
        if (clean !== needleWords[j]) {
          allMatch = false;
          break;
        }
      }
      if (allMatch) return wordTimings[i].start;
    }
  }

  // Single word exact match
  for (const wt of wordTimings) {
    const clean = wt.word.replace(/[.,!?;:'\"()]/g, '').toLowerCase();
    if (clean === needle) return wt.start;
  }

  // Single word contains
  for (const wt of wordTimings) {
    if (wt.word.toLowerCase().includes(needle)) return wt.start;
  }

  return null;
}

export interface BRollSceneProps {
  scene: Scene;
}

export const BRollScene: React.FC<BRollSceneProps> = ({ scene }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();

  // Determine Ken Burns direction based on scene text length (simple hash)
  const isEvenDirection = (scene.script_line.text.length % 2) === 0;
  const currentTime = frame / fps;

  // Spring-based entrance scale (snappy UI feel per REMOTION_SKILLS.md)
  const entranceSpring = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 200 },
  });

  // Ken Burns effect - alternate direction per scene for visual variety
  // Combined with entrance spring for smooth start
  const baseScale = interpolate(
    frame,
    [0, durationInFrames],
    isEvenDirection
      ? [BROLL.KEN_BURNS_SCALE_START, BROLL.KEN_BURNS_SCALE_END]
      : [BROLL.KEN_BURNS_SCALE_END, BROLL.KEN_BURNS_SCALE_START]
  );

  // Entrance scale: start slightly zoomed, settle to base
  const entranceScale = interpolate(entranceSpring, [0, 1], [1.08, 1]);

  // === ZOOM PUNCH on highlight word ===
  // Quick zoom pulse when highlight word is spoken
  const highlightTime = scene.script_line.highlight_word
    ? findHighlightTime(scene.script_line.highlight_word, scene.audio.word_timings)
    : null;

  let zoomPunch = 1;
  if (highlightTime !== null) {
    // Punch in fast, ease out slower (using brand constant)
    const zoomAmount = HIGHLIGHT_EFFECTS.ZOOM_PUNCH_AMOUNT;
    zoomPunch = interpolate(
      currentTime,
      [highlightTime - 0.02, highlightTime, highlightTime + 0.08, highlightTime + 0.25],
      [1, zoomAmount, 1 + (zoomAmount - 1) / 2, 1],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );
  }

  const scale = baseScale * entranceScale * zoomPunch;

  const translateX = interpolate(
    frame,
    [0, durationInFrames],
    isEvenDirection
      ? [0, -BROLL.KEN_BURNS_TRANSLATE_MAX]
      : [0, BROLL.KEN_BURNS_TRANSLATE_MAX * 0.67] // 20px for right pan
  );

  // Entrance slide-up with easing
  const entranceTranslateY = interpolate(frame, [0, 15], [20, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

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
              transform: `scale(${scale}) translate3d(${translateX}px, ${entranceTranslateY}px, 0)`,
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

      {/* Highlight flash takeover for key phrases/numbers */}
      {scene.script_line.highlight_word && (
        <HighlightFlash
          highlightWord={scene.script_line.highlight_word}
          wordTimings={scene.audio.word_timings}
          sceneDurationSeconds={scene.audio.duration}
        />
      )}

      {/* Subtitles overlay */}
      {scene.audio.word_timings && scene.audio.word_timings.length > 0 && (
        <SubtitleOverlay wordTimings={scene.audio.word_timings} startFrame={0} />
      )}
    </AbsoluteFill>
  );
};
