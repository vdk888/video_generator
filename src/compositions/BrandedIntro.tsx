/**
 * BrandedIntro - 3-5 second branded intro sequence
 * Per VIDEO_BIBLE.md: White background, logo centered, multi-stage animation
 *
 * Animation sequence:
 * 1. Accent line scales in (frames 0-20)
 * 2. Logo fades in with spring (frames 10-50, overlapping)
 * 3. Hold + fade out (last 12 frames)
 */

import React from 'react';
import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  interpolate,
  spring,
} from 'remotion';
import { INTRO_OUTRO, FONTS, COLORS } from '../brand';

export interface BrandedIntroProps {
  logoPath?: string | null;
  duration?: number; // in frames
}

export const BrandedIntro: React.FC<BrandedIntroProps> = ({
  logoPath,
  duration = 75, // 3s at 25fps
}) => {
  const frame = useCurrentFrame();
  const fps = 25;

  // STAGE 1: Accent line (frames 0-20)
  const accentLineScale = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // STAGE 2: Logo spring animation (frames 10-50)
  const logoSpringValue = spring({
    frame: Math.max(0, frame - 10),
    fps,
    config: {
      stiffness: 180,
      damping: 12,
      mass: 0.6,
    },
  });

  // STAGE 3: Global fade out (last 12 frames)
  const fadeOutStart = duration - 12;
  const globalOpacity = interpolate(frame, [fadeOutStart, duration], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background: 'radial-gradient(ellipse at center, #FFFFFF 0%, #F0F0F8 100%)',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div style={{ opacity: globalOpacity, position: 'relative' }}>
        {/* Stage 1: Accent line */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scaleX(${accentLineScale})`,
            transformOrigin: 'center',
            width: 200,
            height: 3,
            backgroundColor: COLORS.ACCENT_VIOLET,
            boxShadow: '0 0 30px rgba(102, 126, 234, 0.5)',
            marginTop: -80, // Position above logo
          }}
        />

        {/* Stage 2: Logo with spring animation */}
        <div
          style={{
            opacity: logoSpringValue,
            transform: `scale(${logoSpringValue})`,
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
      </div>

      {/* Tagline that appears after logo */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${interpolate(frame, [35, 50], [15, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}px)`,
          opacity: interpolate(frame, [35, 50], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) * globalOpacity,
          fontSize: 24,
          fontFamily: FONTS.FAMILY,
          fontWeight: 400,
          color: COLORS.GRAY_MEDIUM,
          marginTop: 120, // Position below logo
          letterSpacing: '2px',
          textTransform: 'uppercase' as const,
        }}
      >
        Comprendre la tech, simplement
      </div>
    </AbsoluteFill>
  );
};
