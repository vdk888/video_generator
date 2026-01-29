/**
 * Scale Comparison Animation - Objects at different scales
 * Great for "10x bigger" or comparing relative sizes
 *
 * Usage in script.json:
 * {
 *   "scene_type": "animated",
 *   "animation": {
 *     "type": "scale_comparison",
 *     "params": {
 *       "items": [
 *         { "label": "2020", "scale": 1 },
 *         { "label": "2023", "scale": 10, "color": "#667eea" }
 *       ],
 *       "object": "circle",
 *       "showLabels": true
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
import type { ScaleComparisonParams, BaseAnimationProps } from './types';
import { FONTS, COLORS } from '../../brand';

type Props = Omit<ScaleComparisonParams, 'type'> & BaseAnimationProps;

export const ScaleComparison: React.FC<Props> = ({
  items,
  object = 'circle',
  customIcon,
  showLabels = true,
  layout = 'horizontal',
  durationInFrames,
  delayFrames = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const adjustedFrame = Math.max(0, frame - delayFrames);

  // Find max scale for normalization
  const maxScale = Math.max(...items.map(i => i.scale));
  const baseSize = 40; // Base size in px

  // Entrance animation
  const entranceSpring = spring({
    frame: adjustedFrame,
    fps,
    config: { damping: 20, stiffness: 100 },
  });

  const containerOpacity = interpolate(entranceSpring, [0, 1], [0, 1]);

  const isHorizontal = layout === 'horizontal';

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
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: isHorizontal ? 'row' : 'column',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: isHorizontal ? 80 : 40,
        }}
      >
        {items.map((item, i) => {
          // Stagger animation
          const itemDelay = (i / items.length) * durationInFrames * 0.3;
          const itemFrame = Math.max(0, adjustedFrame - itemDelay);

          const itemSpring = spring({
            frame: itemFrame,
            fps,
            config: { damping: 12, stiffness: 150, mass: 0.8 },
          });

          // Calculate size
          const normalizedScale = item.scale / maxScale;
          const targetSize = baseSize + normalizedScale * 200; // 40-240px range
          const currentSize = interpolate(itemSpring, [0, 1], [baseSize * 0.5, targetSize]);

          const itemColor = item.color || COLORS.ACCENT_VIOLET;

          // Render object
          const renderObject = () => {
            const style: React.CSSProperties = {
              width: currentSize,
              height: currentSize,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'none',
            };

            switch (object) {
              case 'circle':
                return (
                  <div
                    style={{
                      ...style,
                      borderRadius: '50%',
                      background: `radial-gradient(circle at 30% 30%, ${itemColor}, ${itemColor}88)`,
                      boxShadow: `
                        0 0 ${currentSize * 0.3}px ${itemColor}44,
                        inset 0 ${currentSize * 0.1}px ${currentSize * 0.2}px rgba(255, 255, 255, 0.3)
                      `,
                    }}
                  />
                );

              case 'square':
                return (
                  <div
                    style={{
                      ...style,
                      borderRadius: currentSize * 0.1,
                      background: `linear-gradient(135deg, ${itemColor}, ${itemColor}88)`,
                      boxShadow: `
                        0 0 ${currentSize * 0.3}px ${itemColor}44,
                        inset 0 ${currentSize * 0.1}px ${currentSize * 0.2}px rgba(255, 255, 255, 0.2)
                      `,
                    }}
                  />
                );

              case 'bar':
                return (
                  <div
                    style={{
                      width: 60,
                      height: currentSize,
                      borderRadius: 8,
                      background: `linear-gradient(180deg, ${itemColor}, ${itemColor}88)`,
                      boxShadow: `
                        0 0 20px ${itemColor}44,
                        inset 0 4px 10px rgba(255, 255, 255, 0.2)
                      `,
                    }}
                  />
                );

              case 'custom':
                return (
                  <div
                    style={{
                      ...style,
                      fontSize: currentSize * 0.8,
                    }}
                  >
                    {customIcon || '●'}
                  </div>
                );

              default:
                return null;
            }
          };

          const labelOpacity = interpolate(itemSpring, [0.5, 1], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
              }}
            >
              {renderObject()}

              {showLabels && (
                <>
                  {/* Label */}
                  <div
                    style={{
                      marginTop: 20,
                      fontSize: 24,
                      fontFamily: FONTS.FAMILY,
                      fontWeight: 600,
                      color: '#FFFFFF',
                      opacity: labelOpacity,
                      textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
                    }}
                  >
                    {item.label}
                  </div>

                  {/* Scale indicator */}
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 36,
                      fontFamily: FONTS.FAMILY,
                      fontWeight: 800,
                      color: itemColor,
                      opacity: labelOpacity,
                      textShadow: `0 0 15px ${itemColor}66`,
                    }}
                  >
                    {item.scale}x
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
