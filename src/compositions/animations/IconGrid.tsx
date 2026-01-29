/**
 * Icon Grid Animation - Icons appearing in a grid pattern
 * Great for "1 in 10 people" type statistics
 *
 * Usage in script.json:
 * {
 *   "scene_type": "animated",
 *   "animation": {
 *     "type": "icon_grid",
 *     "params": {
 *       "total": 10,
 *       "highlighted": 3,
 *       "icon": "person",
 *       "columns": 5,
 *       "highlightColor": "#ef4444"
 *     }
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
import type { IconGridParams, BaseAnimationProps } from './types';
import { COLORS } from '../../brand';

type Props = Omit<IconGridParams, 'type'> & BaseAnimationProps;

// Icon definitions
const ICONS: Record<string, string> = {
  person: '👤',
  circle: '●',
  square: '■',
  star: '★',
  dollar: '💵',
  heart: '❤️',
  check: '✓',
  x: '✗',
};

export const IconGrid: React.FC<Props> = ({
  total,
  highlighted,
  icon = 'person',
  customIcon,
  columns = 5,
  color = 'rgba(255, 255, 255, 0.4)',
  highlightColor = COLORS.ACCENT_VIOLET,
  animationStyle = 'sequential',
  durationInFrames,
  delayFrames = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const adjustedFrame = Math.max(0, frame - delayFrames);

  const iconChar = icon === 'custom' ? (customIcon || '●') : (ICONS[icon] || '●');
  const rows = Math.ceil(total / columns);

  // Icon size based on grid
  const iconSize = Math.min(80, 600 / columns);
  const gap = iconSize * 0.3;

  // Calculate which icons are highlighted (first N)
  const highlightedIndices = new Set(
    Array.from({ length: highlighted }, (_, i) => i)
  );

  // Entrance animation
  const entranceSpring = spring({
    frame: adjustedFrame,
    fps,
    config: { damping: 20, stiffness: 100 },
  });

  const containerOpacity = interpolate(entranceSpring, [0, 1], [0, 1]);
  const containerScale = interpolate(entranceSpring, [0, 1], [0.9, 1]);

  // Generate icons
  const icons = [];
  for (let i = 0; i < total; i++) {
    const row = Math.floor(i / columns);
    const col = i % columns;
    const isHighlighted = highlightedIndices.has(i);

    // Sequential animation delay
    let iconDelay = 0;
    if (animationStyle === 'sequential') {
      iconDelay = (i / total) * durationInFrames * 0.4;
    } else if (animationStyle === 'fade') {
      iconDelay = 0;
    } else {
      // scale - all at once with slight stagger
      iconDelay = (i / total) * durationInFrames * 0.1;
    }

    const iconFrame = Math.max(0, adjustedFrame - iconDelay);

    const iconSpring = spring({
      frame: iconFrame,
      fps,
      config: { damping: 12, stiffness: 180, mass: 0.6 },
    });

    const iconScale = interpolate(iconSpring, [0, 1], [0, 1]);
    const iconOpacity = interpolate(iconSpring, [0, 1], [0, 1]);

    // Highlight animation (after all icons appear)
    const highlightDelay = durationInFrames * 0.5;
    const highlightFrame = Math.max(0, adjustedFrame - highlightDelay - (i * 2));

    const highlightSpring = spring({
      frame: highlightFrame,
      fps,
      config: { damping: 10, stiffness: 200 },
    });

    const highlightScale = isHighlighted
      ? interpolate(highlightSpring, [0, 1], [1, 1.2])
      : 1;

    const highlightGlow = isHighlighted
      ? interpolate(highlightSpring, [0, 1], [0, 1])
      : 0;

    icons.push(
      <div
        key={i}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: iconSize,
          height: iconSize,
          fontSize: iconSize * 0.7,
          color: isHighlighted && highlightGlow > 0.5 ? highlightColor : color,
          opacity: iconOpacity,
          transform: `scale(${iconScale * highlightScale})`,
          filter: isHighlighted && highlightGlow > 0.5
            ? `drop-shadow(0 0 ${10 * highlightGlow}px ${highlightColor})`
            : 'none',
          transition: 'color 0.2s ease',
        }}
      >
        {iconChar}
      </div>
    );
  }

  // Calculate grid dimensions
  const gridWidth = columns * iconSize + (columns - 1) * gap;
  const gridHeight = rows * iconSize + (rows - 1) * gap;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        opacity: containerOpacity,
        transform: `scale(${containerScale})`,
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, ${iconSize}px)`,
          gridTemplateRows: `repeat(${rows}, ${iconSize}px)`,
          gap,
        }}
      >
        {icons}
      </div>

      {/* Stats label */}
      <div
        style={{
          marginTop: 40,
          fontSize: 48,
          fontWeight: 800,
          color: highlightColor,
          textShadow: `0 0 20px ${highlightColor}66`,
        }}
      >
        {highlighted} / {total}
      </div>
    </div>
  );
};
