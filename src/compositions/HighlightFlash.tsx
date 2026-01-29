/**
 * HighlightFlash - Aggressive mid-scene takeover for key phrases/numbers
 *
 * When a highlight_word is spoken during a B-roll scene, it SLAMS onto screen:
 * - Hard white flash
 * - Text snaps in at 1.3x scale then punches down to 1.0x (overshoot)
 * - Screen shake on impact
 * - Heavy background dim
 * - Fast, aggressive timing — no soft fades
 *
 * Timing: ~1.0-1.5s total, synced to word_timings
 */

import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from 'remotion';
import { KINETIC, FONTS, LAYOUT, COLORS, HIGHLIGHT_EFFECTS } from '../brand';
import type { WordTiming } from '../types';

export interface HighlightFlashProps {
  highlightWord: string;
  wordTimings: WordTiming[] | null | undefined;
  sceneDurationSeconds: number;
}

/**
 * Find the time range when the highlight word/phrase is spoken.
 * For multi-word phrases, finds the span from first word start to last word end.
 */
function findHighlightTiming(
  highlightWord: string,
  wordTimings: WordTiming[],
): { start: number; end: number } | null {
  const needle = highlightWord.toLowerCase();
  const needleWords = needle.split(/\s+/);

  // Multi-word phrase: find consecutive word matches
  if (needleWords.length > 1) {
    for (let i = 0; i <= wordTimings.length - needleWords.length; i++) {
      let allMatch = true;
      for (let j = 0; j < needleWords.length; j++) {
        const clean = wordTimings[i + j].word.replace(/[.,!?;:'"()]/g, '').toLowerCase();
        if (clean !== needleWords[j]) {
          allMatch = false;
          break;
        }
      }
      if (allMatch) {
        return {
          start: wordTimings[i].start,
          end: wordTimings[i + needleWords.length - 1].end,
        };
      }
    }
    // Fallback: try contains on joined text windows
    for (let i = 0; i < wordTimings.length; i++) {
      const windowSize = Math.min(needleWords.length + 1, wordTimings.length - i);
      const windowText = wordTimings.slice(i, i + windowSize)
        .map(w => w.word.replace(/[.,!?;:'"()]/g, '').toLowerCase())
        .join(' ');
      if (windowText.includes(needle)) {
        return {
          start: wordTimings[i].start,
          end: wordTimings[Math.min(i + windowSize - 1, wordTimings.length - 1)].end,
        };
      }
    }
  }

  // Single word: exact match
  for (const wt of wordTimings) {
    const clean = wt.word.replace(/[.,!?;:'"()]/g, '').toLowerCase();
    if (clean === needle) {
      return { start: wt.start, end: wt.end };
    }
  }

  // Single word: contains match
  for (const wt of wordTimings) {
    if (wt.word.toLowerCase().includes(needle)) {
      return { start: wt.start, end: wt.end };
    }
  }

  return null;
}

export const HighlightFlash: React.FC<HighlightFlashProps> = ({
  highlightWord,
  wordTimings,
  sceneDurationSeconds,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const timing = wordTimings && wordTimings.length > 0
    ? findHighlightTiming(highlightWord, wordTimings)
    : null;

  // Fallback: show at 40% into scene
  const resolvedTiming = timing ?? {
    start: sceneDurationSeconds * 0.4,
    end: sceneDurationSeconds * 0.4 + 0.5,
  };

  const currentTime = frame / fps;

  // === AGGRESSIVE TIMING ===
  // Impact is INSTANT — no gentle lead-in
  const impactTime = resolvedTiming.start;        // text slams at word start
  const holdEnd = resolvedTiming.end + 0.15;      // short hold after word
  const exitEnd = holdEnd + 0.25;                 // fast exit

  // Total effect window
  const effectStart = impactTime - 0.05;          // tiny pre-flash
  const effectEnd = exitEnd;

  if (currentTime < effectStart || currentTime > effectEnd) {
    return null;
  }

  // === WHITE FLASH — peaks at impact, BIGGER flash ===
  const flashOpacity = interpolate(
    currentTime,
    [impactTime - 0.02, impactTime, impactTime + 0.06, impactTime + 0.12],
    [0, 1.0, 0.4, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  // === COLOR POP — violet flash after white ===
  const colorPopOpacity = interpolate(
    currentTime,
    [impactTime + 0.04, impactTime + 0.08, impactTime + 0.2],
    [0, 0.3, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  // === BACKGROUND DIM — snaps dark FASTER, deeper ===
  const bgDim = interpolate(
    currentTime,
    [impactTime - 0.03, impactTime, holdEnd, exitEnd],
    [0, 0.85, 0.85, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  // === TEXT SCALE — spring-based bounce for organic feel ===
  const impactFrame = Math.floor(impactTime * fps);
  const framesSinceImpact = Math.max(0, frame - impactFrame);

  // Bouncy spring for entrance (low damping = more bounce)
  const scaleSpring = spring({
    frame: framesSinceImpact,
    fps,
    config: { damping: 8, stiffness: 200, mass: 0.8 }, // Bouncy preset
    from: 0.3,
    to: 1,
  });

  // Add extra punch at start (overshoot)
  const textScaleEntrance = interpolate(
    scaleSpring,
    [0, 0.5, 0.8, 1],
    [0.3, 1.35, 0.95, 1.0],
  );

  // Exit: zoom through (1.0 → 1.3) while fading
  const textScaleExit = interpolate(
    currentTime,
    [holdEnd, exitEnd],
    [1.0, 1.3],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad) },
  );

  const isExiting = currentTime > holdEnd;
  const textScale = isExiting ? textScaleExit : textScaleEntrance;

  // === TEXT OPACITY — instant on, fast exit ===
  const textOpacity = isExiting
    ? interpolate(currentTime, [holdEnd, exitEnd], [1, 0], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
        easing: Easing.in(Easing.quad),
      })
    : interpolate(scaleSpring, [0, 0.3], [0, 1], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
      });

  // === SCREEN SHAKE — MORE AGGRESSIVE, longer duration ===
  const shakeIntensity = interpolate(
    currentTime,
    [impactTime, impactTime + 0.03, impactTime + 0.08, impactTime + 0.15],
    [0, 25, 12, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  // Use frame number for deterministic pseudo-random shake direction - faster oscillation
  const shakeX = shakeIntensity * Math.sin(frame * 9.7);
  const shakeY = shakeIntensity * Math.cos(frame * 13.3);

  // === TEXT Y SLAM — drops from above ===
  const textY = interpolate(
    currentTime,
    [impactTime, impactTime + 0.08],
    [-40, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad) },
  );

  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        transform: `translate(${shakeX}px, ${shakeY}px)`,
      }}
    >
      {/* Hard background dim */}
      <AbsoluteFill
        style={{
          backgroundColor: `rgba(0, 0, 0, ${bgDim})`,
        }}
      />

      {/* White flash on impact */}
      {flashOpacity > 0.01 && (
        <AbsoluteFill
          style={{
            backgroundColor: `rgba(255, 255, 255, ${flashOpacity})`,
          }}
        />
      )}

      {/* Color pop - violet accent flash */}
      {colorPopOpacity > 0.01 && (
        <AbsoluteFill
          style={{
            backgroundColor: `rgba(102, 126, 234, ${colorPopOpacity})`,
          }}
        />
      )}

      {/* DRAMATIC text — slams in with impact */}
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            fontSize: HIGHLIGHT_EFFECTS.TEXT_FONT_SIZE,
            fontFamily: FONTS.FAMILY,
            fontWeight: HIGHLIGHT_EFFECTS.TEXT_FONT_WEIGHT,
            color: '#FFFFFF', // Pure white for maximum impact
            textAlign: 'center',
            padding: `0 ${LAYOUT.PADDING_HORIZONTAL}px`,
            maxWidth: `${LAYOUT.MAX_WIDTH_PERCENT}%`,
            lineHeight: 1.0,
            letterSpacing: '-4px', // Tighter
            transform: `scale(${textScale}) translateY(${textY}px)`,
            opacity: textOpacity,
            textShadow: HIGHLIGHT_EFFECTS.TEXT_GLOW,
            textTransform: 'uppercase',
            // Subtle stroke for edge definition
            WebkitTextStroke: '2px rgba(102, 126, 234, 0.8)',
          }}
        >
          {highlightWord}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
