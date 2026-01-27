/**
 * BrandedIntro - 3-5 second branded intro sequence
 * Per VIDEO_BIBLE.md: White background, logo centered, fade-in animation
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

export interface BrandedIntroProps {
  logoPath?: string | null;
  duration?: number; // in frames
}

export const BrandedIntro: React.FC<BrandedIntroProps> = ({
  logoPath,
  duration = 75, // 3s at 25fps
}) => {
  const frame = useCurrentFrame();

  // Fade in animation using brand constants
  const fadeInDuration = secondsToFrames(INTRO_OUTRO.FADE_DURATION, 25); // 12.5 frames
  const opacity = interpolate(frame, [0, fadeInDuration], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Scale animation using brand constants
  const scale = interpolate(frame, [0, fadeInDuration], [INTRO_OUTRO.SCALE_FROM, INTRO_OUTRO.SCALE_TO], {
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
          transform: `scale(${scale})`,
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
      </div>
    </AbsoluteFill>
  );
};
