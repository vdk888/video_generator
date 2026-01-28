/**
 * SubtitleOverlay - Display subtitles based on word timings
 * Styled per VIDEO_BIBLE.md: 60pt white text, black outline, bottom position
 * IMPORTANT: Uses violet (#667eea) for highlights, NOT orange (bug fix)
 */

import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { SUBTITLES, FONTS, LAYOUT } from '../brand';
import type { WordTiming } from '../types';

export interface SubtitleOverlayProps {
  wordTimings: WordTiming[];
  startFrame: number;
}

export const SubtitleOverlay: React.FC<SubtitleOverlayProps> = ({
  wordTimings,
  startFrame,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Calculate current time in seconds relative to start
  const currentTime = (frame - startFrame) / fps;

  // Find current word(s) to display
  const currentWords = wordTimings.filter(
    (timing) => currentTime >= timing.start && currentTime <= timing.end
  );

  if (currentWords.length === 0) {
    return null;
  }

  // Combine current words into a single line
  const text = currentWords.map((w) => w.word).join(' ');

  // Calculate fade for smooth transitions (0.1s fade in/out)
  const firstWordStart = currentWords[0].start;
  const lastWordEnd = currentWords[currentWords.length - 1].end;
  const fadeInDuration = 0.1; // seconds
  const fadeOutDuration = 0.1;

  let opacity = 1;

  // Fade in
  if (currentTime < firstWordStart + fadeInDuration) {
    opacity = interpolate(
      currentTime,
      [firstWordStart, firstWordStart + fadeInDuration],
      [0, 1],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );
  }

  // Fade out
  if (currentTime > lastWordEnd - fadeOutDuration) {
    opacity = interpolate(
      currentTime,
      [lastWordEnd - fadeOutDuration, lastWordEnd],
      [1, 0],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );
  }

  // Scale-in entrance animation
  const scaleIn = interpolate(
    currentTime,
    [firstWordStart, firstWordStart + 0.15],
    [0.9, 1.0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <div
      style={{
        position: 'absolute',
        bottom: SUBTITLES.BOTTOM_OFFSET,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        opacity,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          backgroundColor: SUBTITLES.BACKGROUND_COLOR,
          borderRadius: '12px',
          padding: `${SUBTITLES.BACKGROUND_PADDING_V}px ${SUBTITLES.BACKGROUND_PADDING_H}px`,
          fontSize: SUBTITLES.FONT_SIZE,
          fontFamily: FONTS.FAMILY,
          fontWeight: SUBTITLES.FONT_WEIGHT,
          color: SUBTITLES.COLOR,
          textAlign: 'center',
          textShadow: SUBTITLES.TEXT_SHADOW,
          maxWidth: `${LAYOUT.MAX_WIDTH_PERCENT}%`,
          lineHeight: 1.4,
          transform: `scale(${scaleIn})`,
        }}
      >
        {text}
      </div>
    </div>
  );
};
