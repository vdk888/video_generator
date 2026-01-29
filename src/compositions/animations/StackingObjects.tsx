/**
 * Stacking Objects Animation - Objects piling up visually
 *
 * Usage in script.json:
 * {
 *   "scene_type": "animated",
 *   "animation": {
 *     "type": "stacking",
 *     "params": { "object": "bill", "count": 20, "direction": "up", "showCount": true }
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
import type { StackingParams, BaseAnimationProps } from './types';
import { FONTS, COLORS } from '../../brand';

type Props = Omit<StackingParams, 'type'> & BaseAnimationProps;

// Object visuals
const OBJECTS: Record<string, { emoji: string; width: number; height: number }> = {
  bill: { emoji: '💵', width: 80, height: 40 },
  coin: { emoji: '🪙', width: 50, height: 50 },
  document: { emoji: '📄', width: 60, height: 70 },
  box: { emoji: '📦', width: 60, height: 60 },
  person: { emoji: '👤', width: 50, height: 60 },
};

export const StackingObjects: React.FC<Props> = ({
  object = 'bill',
  customIcon,
  count,
  direction = 'up',
  color = COLORS.ACCENT_VIOLET,
  showCount = false,
  durationInFrames,
  delayFrames = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const adjustedFrame = Math.max(0, frame - delayFrames);

  // Object config
  const objectConfig = object === 'custom'
    ? { emoji: customIcon || '📦', width: 60, height: 60 }
    : OBJECTS[object] || OBJECTS.bill;

  // Calculate how many objects are visible
  const animationProgress = interpolate(
    adjustedFrame,
    [0, durationInFrames * 0.8],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad) }
  );

  const visibleCount = Math.floor(animationProgress * count);

  // Generate objects
  const objects = [];
  for (let i = 0; i < visibleCount; i++) {
    // Stagger each object's entrance
    const objectDelay = (i / count) * durationInFrames * 0.6;
    const objectFrame = Math.max(0, adjustedFrame - objectDelay);

    const objectSpring = spring({
      frame: objectFrame,
      fps,
      config: { damping: 12, stiffness: 200, mass: 0.5 },
    });

    // Position based on direction
    let x = 0;
    let y = 0;
    const spacing = direction === 'up' || direction === 'down' ? 25 : 40;
    const randomOffset = Math.sin(i * 7.3) * 8; // Slight random offset for natural look

    switch (direction) {
      case 'up':
        y = -i * spacing;
        x = randomOffset;
        break;
      case 'down':
        y = i * spacing;
        x = randomOffset;
        break;
      case 'left':
        x = -i * spacing;
        y = randomOffset;
        break;
      case 'right':
        x = i * spacing;
        y = randomOffset;
        break;
    }

    // Entry animation - drop in from above
    const entryOffset = interpolate(objectSpring, [0, 1], [direction === 'down' ? -100 : 100, 0]);
    const entryScale = interpolate(objectSpring, [0, 1], [0.3, 1]);
    const entryOpacity = interpolate(objectSpring, [0, 1], [0, 1]);
    const entryRotation = interpolate(objectSpring, [0, 1], [Math.sin(i * 3) * 30, Math.sin(i * 3) * 5]);

    objects.push(
      <div
        key={i}
        style={{
          position: 'absolute',
          fontSize: objectConfig.width,
          transform: `translate(${x}px, ${y + (direction === 'up' || direction === 'down' ? entryOffset : 0)}px) scale(${entryScale}) rotate(${entryRotation}deg)`,
          opacity: entryOpacity,
          filter: `drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))`,
          zIndex: count - i, // Stack order
        }}
      >
        {objectConfig.emoji}
      </div>
    );
  }

  // Overall container animation
  const containerSpring = spring({
    frame: adjustedFrame,
    fps,
    config: { damping: 20, stiffness: 100 },
  });

  const containerScale = interpolate(containerSpring, [0, 1], [0.8, 1]);
  const containerOpacity = interpolate(containerSpring, [0, 1], [0, 1]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        transform: `scale(${containerScale})`,
        opacity: containerOpacity,
      }}
    >
      {/* Stack container */}
      <div
        style={{
          position: 'relative',
          width: 300,
          height: 400,
          display: 'flex',
          alignItems: direction === 'up' ? 'flex-end' : direction === 'down' ? 'flex-start' : 'center',
          justifyContent: direction === 'left' ? 'flex-end' : direction === 'right' ? 'flex-start' : 'center',
        }}
      >
        {objects}
      </div>

      {/* Count label */}
      {showCount && visibleCount > 0 && (
        <div
          style={{
            marginTop: 40,
            fontSize: 72,
            fontFamily: FONTS.FAMILY,
            fontWeight: 800,
            color: '#FFFFFF',
            textShadow: `
              0 0 20px ${color}88,
              0 4px 15px rgba(0, 0, 0, 0.5)
            `,
          }}
        >
          {visibleCount}
        </div>
      )}
    </div>
  );
};
