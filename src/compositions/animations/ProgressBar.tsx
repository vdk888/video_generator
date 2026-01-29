/**
 * Progress Bar Animation - Horizontal/vertical filling bar
 *
 * Usage in script.json:
 * {
 *   "scene_type": "animated",
 *   "animation": {
 *     "type": "progress_bar",
 *     "params": { "startPercent": 0, "endPercent": 80, "label": "Dette / PIB", "showLabel": true }
 *   }
 * }
 */

import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from 'remotion';
import type { ProgressBarParams, BaseAnimationProps } from './types';
import { FONTS, COLORS } from '../../brand';

type Props = Omit<ProgressBarParams, 'type'> & BaseAnimationProps;

export const ProgressBar: React.FC<Props> = ({
  startPercent = 0,
  endPercent,
  orientation = 'horizontal',
  color = COLORS.ACCENT_VIOLET,
  backgroundColor = 'rgba(255, 255, 255, 0.2)',
  showLabel = true,
  label,
  size = 60,
  durationInFrames,
  delayFrames = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const adjustedFrame = Math.max(0, frame - delayFrames);

  // Animate fill percentage
  const fillProgress = interpolate(
    adjustedFrame,
    [0, durationInFrames * 0.7],
    [startPercent, endPercent],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    }
  );

  // Entrance animation
  const entranceSpring = spring({
    frame: adjustedFrame,
    fps,
    config: { damping: 20, stiffness: 150 },
  });

  const scale = interpolate(entranceSpring, [0, 1], [0.9, 1]);
  const opacity = interpolate(entranceSpring, [0, 1], [0, 1]);

  // Glow intensity based on fill
  const glowIntensity = interpolate(fillProgress, [0, 100], [0.3, 0.8]);

  // Danger color when high
  const fillColor = fillProgress > 80
    ? interpolate(fillProgress, [80, 100], [0, 1]) > 0.5
      ? '#ef4444' // Red
      : color
    : color;

  const isHorizontal = orientation === 'horizontal';
  const barLength = 800;
  const barThickness = size;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        transform: `scale(${scale})`,
        opacity,
      }}
    >
      {/* Label above */}
      {showLabel && label && (
        <div
          style={{
            fontSize: 36,
            fontFamily: FONTS.FAMILY,
            fontWeight: 600,
            color: '#FFFFFF',
            marginBottom: 30,
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
            textTransform: 'uppercase',
            letterSpacing: '2px',
          }}
        >
          {label}
        </div>
      )}

      {/* Bar container */}
      <div
        style={{
          position: 'relative',
          width: isHorizontal ? barLength : barThickness,
          height: isHorizontal ? barThickness : barLength,
          backgroundColor,
          borderRadius: barThickness / 2,
          overflow: 'hidden',
          boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Fill */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            bottom: 0,
            width: isHorizontal ? `${fillProgress}%` : '100%',
            height: isHorizontal ? '100%' : `${fillProgress}%`,
            background: `linear-gradient(${isHorizontal ? '90deg' : '0deg'}, ${fillColor}cc, ${fillColor})`,
            borderRadius: barThickness / 2,
            boxShadow: `
              0 0 20px ${fillColor}${Math.floor(glowIntensity * 255).toString(16).padStart(2, '0')},
              0 0 40px ${fillColor}${Math.floor(glowIntensity * 128).toString(16).padStart(2, '0')}
            `,
            transition: 'background 0.3s ease',
          }}
        />

        {/* Shine effect */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 100%)',
            borderRadius: `${barThickness / 2}px ${barThickness / 2}px 0 0`,
          }}
        />
      </div>

      {/* Percentage label */}
      {showLabel && (
        <div
          style={{
            marginTop: 30,
            fontSize: 96,
            fontFamily: FONTS.FAMILY,
            fontWeight: 900,
            color: '#FFFFFF',
            textShadow: `
              0 0 20px ${fillColor}88,
              0 4px 20px rgba(0, 0, 0, 0.5)
            `,
          }}
        >
          {Math.round(fillProgress)}%
        </div>
      )}
    </div>
  );
};
