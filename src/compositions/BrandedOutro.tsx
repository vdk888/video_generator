/**
 * BrandedOutro - 3-5 second branded outro sequence
 * Per VIDEO_BIBLE.md: Similar to intro with fade-out, logo + optional CTA
 */

import React from 'react';
import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  interpolate,
} from 'remotion';
import { INTRO_OUTRO, FONTS, secondsToFrames } from '../brand';

export interface BrandedOutroProps {
  logoPath?: string | null;
  ctaText?: string | null;
  duration?: number; // in frames
}

export const BrandedOutro: React.FC<BrandedOutroProps> = ({
  logoPath,
  ctaText,
  duration = 75, // 3s at 25fps
}) => {
  const frame = useCurrentFrame();

  // Fade out animation using brand constants
  const fadeOutDuration = secondsToFrames(INTRO_OUTRO.FADE_DURATION, 25); // 12.5 frames
  const fadeOutStart = duration - fadeOutDuration;
  const opacity = interpolate(frame, [fadeOutStart, duration], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: INTRO_OUTRO.BACKGROUND,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          opacity,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 30,
        }}
      >
        {logoPath ? (
          <Img
            src={staticFile(logoPath)}
            style={{
              width: INTRO_OUTRO.LOGO_WIDTH,
              height: 'auto',
            }}
          />
        ) : (
          // Fallback: Text-only logo using brand constants
          <div
            style={{
              fontSize: INTRO_OUTRO.LOGO_TEXT_SIZE,
              fontFamily: FONTS.FAMILY,
              fontWeight: INTRO_OUTRO.LOGO_TEXT_WEIGHT,
              color: INTRO_OUTRO.LOGO_TEXT_COLOR,
              letterSpacing: INTRO_OUTRO.LOGO_TEXT_SPACING,
            }}
          >
            BUBBLE.
          </div>
        )}

        {ctaText && (
          <div
            style={{
              fontSize: INTRO_OUTRO.CTA_SIZE,
              fontFamily: FONTS.FAMILY,
              fontWeight: INTRO_OUTRO.CTA_WEIGHT,
              color: INTRO_OUTRO.CTA_COLOR,
              textAlign: 'center',
              maxWidth: '80%',
            }}
          >
            {ctaText}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
