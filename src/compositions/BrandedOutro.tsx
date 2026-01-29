/**
 * BrandedOutro - 3-5 second branded outro sequence
 * Per VIDEO_BIBLE.md: Multi-stage animation with logo, CTA, accent line
 *
 * Animation sequence:
 * 1. Logo animation plays (supports video or image)
 * 2. CTA text slides up (frames 5-25)
 * 3. Accent line draws in (frames 20-40)
 * 4. Everything fades out (last 15 frames)
 */

import React from 'react';
import {
  AbsoluteFill,
  Img,
  Video,
  staticFile,
  useCurrentFrame,
  interpolate,
  Easing,
} from 'remotion';
import { INTRO_OUTRO, FONTS, COLORS } from '../brand';

export interface BrandedOutroProps {
  logoPath?: string | null;
  logoVideoPath?: string | null; // For animated logo (mov/mp4)
  ctaText?: string | null;
  duration?: number; // in frames
}

export const BrandedOutro: React.FC<BrandedOutroProps> = ({
  logoPath,
  logoVideoPath,
  ctaText,
  duration = 75, // 3s at 25fps
}) => {
  const frame = useCurrentFrame();

  // STAGE 2: CTA text slides up (frames 5-25)
  const ctaTranslateY = interpolate(frame, [5, 25], [60, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const ctaOpacity = interpolate(frame, [5, 25], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // STAGE 3: Accent line draws in (frames 20-40)
  const accentLineScale = interpolate(frame, [20, 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // STAGE 4: Global fade out (last 15 frames)
  const fadeOutStart = duration - 15;
  const globalOpacity = interpolate(frame, [fadeOutStart, duration], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Exit scale during fade out for subtle shrink effect
  const exitScale = interpolate(frame, [fadeOutStart, duration], [1, 0.95], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Determine if we have an animated logo
  const hasVideoLogo = logoVideoPath && (
    logoVideoPath.endsWith('.mov') ||
    logoVideoPath.endsWith('.mp4') ||
    logoVideoPath.endsWith('.webm')
  );

  return (
    <AbsoluteFill
      style={{
        background: 'radial-gradient(ellipse at center, #FFFFFF 0%, #F0F0F8 100%)',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          opacity: globalOpacity,
          transform: `scale(${exitScale})`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 30,
        }}
      >
        {/* Stage 1: Logo (video animation, static image, or text fallback) */}
        {hasVideoLogo ? (
          <Video
            src={staticFile(logoVideoPath!)}
            style={{
              width: INTRO_OUTRO.LOGO_WIDTH * 1.5,
              height: 'auto',
            }}
          />
        ) : logoPath ? (
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

        {/* Stage 2: CTA text with slide-up animation */}
        {ctaText && (
          <div
            style={{
              fontSize: INTRO_OUTRO.CTA_SIZE,
              fontFamily: FONTS.FAMILY,
              fontWeight: INTRO_OUTRO.CTA_WEIGHT,
              color: COLORS.ACCENT_VIOLET, // Changed to violet per requirements
              textAlign: 'center',
              maxWidth: '80%',
              transform: `translateY(${ctaTranslateY}px)`,
              opacity: ctaOpacity,
            }}
          >
            {ctaText}
          </div>
        )}

        {/* Stage 3: Accent line */}
        {ctaText && (
          <div
            style={{
              width: 200,
              height: 3,
              backgroundColor: COLORS.ACCENT_VIOLET,
              boxShadow: '0 0 30px rgba(102, 126, 234, 0.5)',
              transform: `scaleX(${accentLineScale})`,
              transformOrigin: 'center',
            }}
          />
        )}
      </div>
    </AbsoluteFill>
  );
};
