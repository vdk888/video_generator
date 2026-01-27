/**
 * TitleCard - Section title cards (e.g., "PARTIE 1: LA RÉVOLUTION")
 * Per VIDEO_BIBLE.md: White background, 90pt Inter-ExtraBold, black text, centered
 */

import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { TITLE_CARD, FONTS, LAYOUT, secondsToFrames } from '../brand';

export interface TitleCardProps {
  text: string;
  duration?: number; // in frames, default 50-75 (2-3s at 25fps)
}

export const TitleCard: React.FC<TitleCardProps> = ({
  text,
  duration = 75,
}) => {
  const frame = useCurrentFrame();

  // Fade in duration from brand constants
  const fadeInDuration = secondsToFrames(TITLE_CARD.FADE_IN, 25); // 12.5 frames at 25fps
  const fadeInOpacity = interpolate(frame, [0, fadeInDuration], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Fade out: last 0.5s
  const fadeOutDuration = secondsToFrames(TITLE_CARD.FADE_OUT, 25);
  const fadeOutStart = duration - fadeOutDuration;
  const fadeOutOpacity = interpolate(
    frame,
    [fadeOutStart, duration],
    [1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  const opacity = Math.min(fadeInOpacity, fadeOutOpacity);

  // Subtle scale animation from brand constants
  const scale = interpolate(frame, [0, fadeInDuration], [TITLE_CARD.SCALE_FROM, TITLE_CARD.SCALE_TO], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: TITLE_CARD.BACKGROUND,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          opacity,
          transform: `scale(${scale})`,
          fontSize: TITLE_CARD.FONT_SIZE,
          fontFamily: FONTS.FAMILY,
          fontWeight: TITLE_CARD.FONT_WEIGHT,
          color: TITLE_CARD.COLOR,
          textAlign: 'center',
          padding: `0 ${LAYOUT.PADDING_HORIZONTAL}px`,
          maxWidth: `${LAYOUT.MAX_WIDTH_PERCENT}%`,
          lineHeight: TITLE_CARD.LINE_HEIGHT,
          letterSpacing: TITLE_CARD.LETTER_SPACING,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
