/**
 * Counter Animation - Numbers counting up/down with dramatic styling
 *
 * Usage in script.json:
 * {
 *   "scene_type": "animated",
 *   "animation": {
 *     "type": "counter",
 *     "params": { "start": 0, "end": 100000000, "format": "millions", "suffix": " utilisateurs" }
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
import type { CounterParams, BaseAnimationProps } from './types';
import { FONTS, COLORS } from '../../brand';

type Props = Omit<CounterParams, 'type'> & BaseAnimationProps;

export const Counter: React.FC<Props> = ({
  start = 0,
  end,
  format = 'number',
  prefix = '',
  suffix = '',
  locale = 'fr-FR',
  color = '#FFFFFF',
  fontSize = 160,
  easing = 'easeOut',
  durationInFrames,
  delayFrames = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Adjust frame for delay
  const adjustedFrame = Math.max(0, frame - delayFrames);

  // Animation progress (complete at 75% of duration for dramatic hold)
  const animationEnd = durationInFrames * 0.75;

  // Choose easing function
  const easingFn = {
    linear: (t: number) => t,
    easeOut: Easing.out(Easing.cubic),
    easeInOut: Easing.inOut(Easing.cubic),
    bounce: Easing.out(Easing.bounce),
  }[easing];

  // Interpolate the value
  const rawValue = interpolate(
    adjustedFrame,
    [0, animationEnd],
    [start, end],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: easingFn,
    }
  );

  // Format the number based on format type
  const formatValue = (val: number): string => {
    switch (format) {
      case 'millions':
        if (Math.abs(val) >= 1000000) {
          return (val / 1000000).toFixed(val >= 10000000 ? 0 : 1) + 'M';
        }
        return Math.floor(val).toLocaleString(locale);

      case 'milliards':
        if (Math.abs(val) >= 1000000000) {
          return (val / 1000000000).toFixed(1) + 'Md';
        }
        if (Math.abs(val) >= 1000000) {
          return (val / 1000000).toFixed(0) + 'M';
        }
        return Math.floor(val).toLocaleString(locale);

      case 'percent':
        return val.toFixed(1) + '%';

      case 'currency':
        return Math.floor(val).toLocaleString(locale);

      case 'compact':
        if (Math.abs(val) >= 1000000000) {
          return (val / 1000000000).toFixed(1) + 'B';
        }
        if (Math.abs(val) >= 1000000) {
          return (val / 1000000).toFixed(1) + 'M';
        }
        if (Math.abs(val) >= 1000) {
          return (val / 1000).toFixed(1) + 'K';
        }
        return Math.floor(val).toString();

      case 'number':
      default:
        return Math.floor(val).toLocaleString(locale);
    }
  };

  const displayValue = formatValue(rawValue);

  // Entrance animation
  const entranceSpring = spring({
    frame: adjustedFrame,
    fps,
    config: { damping: 15, stiffness: 150, mass: 0.8 },
  });

  const scale = interpolate(entranceSpring, [0, 1], [0.5, 1]);
  const opacity = interpolate(entranceSpring, [0, 1], [0, 1]);

  // Subtle pulse on value change (every 10 frames)
  const pulsePhase = Math.sin(adjustedFrame * 0.3) * 0.02;
  const pulseScale = 1 + (adjustedFrame < animationEnd ? pulsePhase : 0);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        transform: `scale(${scale * pulseScale})`,
        opacity,
      }}
    >
      <div
        style={{
          fontSize,
          fontFamily: FONTS.FAMILY,
          fontWeight: 900,
          color,
          textAlign: 'center',
          letterSpacing: '-4px',
          textShadow: `
            0 0 20px ${color}66,
            0 0 40px ${COLORS.ACCENT_VIOLET}88,
            0 0 80px ${COLORS.ACCENT_VIOLET}44,
            0 4px 20px rgba(0, 0, 0, 0.5)
          `,
          lineHeight: 1,
        }}
      >
        {prefix}{displayValue}{suffix}
      </div>
    </div>
  );
};
