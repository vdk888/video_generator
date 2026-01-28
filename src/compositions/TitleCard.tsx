/**
 * TitleCard - Section title cards (e.g., "PARTIE 1: LA RÉVOLUTION")
 * Per VIDEO_BIBLE.md: White background, 90pt Inter-ExtraBold, black text, centered
 */

import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from 'remotion';
import { TITLE_CARD, FONTS, LAYOUT, COLORS, secondsToFrames } from '../brand';

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

  // Split text into words for stagger animation
  const words = text.split(' ');

  // Violet accent line animation
  // Delay: all words finished appearing + 5 frames
  const accentLineDelay = words.length * 3 + 5;
  const accentLineDuration = 15;
  const accentLineScale = interpolate(
    frame,
    [accentLineDelay, accentLineDelay + accentLineDuration],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  return (
    <AbsoluteFill
      style={{
        background: 'radial-gradient(ellipse at center, #FFFFFF 0%, #F5F5FA 100%)',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          opacity,
          transform: `scale(${scale})`,
          textAlign: 'center',
          padding: `0 ${LAYOUT.PADDING_HORIZONTAL}px`,
          maxWidth: `${LAYOUT.MAX_WIDTH_PERCENT}%`,
        }}
      >
        {/* Word-by-word stagger animation */}
        <div
          style={{
            fontSize: TITLE_CARD.FONT_SIZE,
            fontFamily: FONTS.FAMILY,
            fontWeight: TITLE_CARD.FONT_WEIGHT,
            color: TITLE_CARD.COLOR,
            lineHeight: TITLE_CARD.LINE_HEIGHT,
            letterSpacing: TITLE_CARD.LETTER_SPACING,
          }}
        >
          {words.map((word, index) => {
            const wordDelay = index * 3;
            const wordDuration = 12;

            const wordOpacity = interpolate(
              frame,
              [wordDelay, wordDelay + wordDuration],
              [0, 1],
              {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }
            );

            const wordTranslateY = interpolate(
              frame,
              [wordDelay, wordDelay + wordDuration],
              [50, 0],
              {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
                easing: Easing.out(Easing.cubic),
              }
            );

            const wordScaleY = interpolate(
              frame,
              [wordDelay, wordDelay + wordDuration],
              [0.7, 1],
              {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
                easing: Easing.out(Easing.cubic),
              }
            );

            return (
              <span
                key={index}
                style={{
                  display: 'inline-block',
                  marginRight: '16px',
                  opacity: wordOpacity,
                  transform: `translateY(${wordTranslateY}px) scaleY(${wordScaleY})`,
                }}
              >
                {word}
              </span>
            );
          })}
        </div>

        {/* Violet accent line below text */}
        <div
          style={{
            width: '160px',
            height: '3px',
            backgroundColor: COLORS.ACCENT_VIOLET,
            margin: '20px auto 0',
            transform: `scaleX(${accentLineScale})`,
            transformOrigin: 'center',
            boxShadow: '0 0 20px rgba(102, 126, 234, 0.4)',
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
