/**
 * Bar Chart Animation - Animated bar graph
 *
 * Usage in script.json:
 * {
 *   "scene_type": "animated",
 *   "animation": {
 *     "type": "bar_chart",
 *     "params": {
 *       "data": [
 *         { "label": "France", "value": 65, "color": "#667eea" },
 *         { "label": "USA", "value": 120, "color": "#ef4444" },
 *         { "label": "Chine", "value": 180, "color": "#10b981" }
 *       ],
 *       "orientation": "vertical",
 *       "showValues": true
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
import type { BarChartParams, BaseAnimationProps } from './types';
import { FONTS, COLORS } from '../../brand';

type Props = Omit<BarChartParams, 'type'> & BaseAnimationProps;

export const BarChart: React.FC<Props> = ({
  data,
  orientation = 'vertical',
  showValues = true,
  color = COLORS.ACCENT_VIOLET,
  animationStyle = 'sequential',
  durationInFrames,
  delayFrames = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const adjustedFrame = Math.max(0, frame - delayFrames);

  const maxValue = Math.max(...data.map(d => d.value));
  const isVertical = orientation === 'vertical';

  // Chart dimensions
  const chartWidth = isVertical ? 800 : 700;
  const chartHeight = isVertical ? 400 : 500;
  const barGap = 20;
  const barSize = isVertical
    ? (chartWidth - barGap * (data.length + 1)) / data.length
    : (chartHeight - barGap * (data.length + 1)) / data.length;

  // Entrance animation
  const entranceSpring = spring({
    frame: adjustedFrame,
    fps,
    config: { damping: 20, stiffness: 100 },
  });

  const containerOpacity = interpolate(entranceSpring, [0, 1], [0, 1]);
  const containerScale = interpolate(entranceSpring, [0, 1], [0.95, 1]);

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
          display: 'flex',
          flexDirection: isVertical ? 'row' : 'column',
          alignItems: isVertical ? 'flex-end' : 'flex-start',
          justifyContent: 'center',
          gap: barGap,
          height: chartHeight,
          width: chartWidth,
        }}
      >
        {data.map((item, i) => {
          // Calculate animation delay for sequential
          const delay = animationStyle === 'sequential'
            ? (i / data.length) * durationInFrames * 0.5
            : 0;

          const barFrame = Math.max(0, adjustedFrame - delay);

          // Bar growth animation
          const barSpring = spring({
            frame: barFrame,
            fps,
            config: { damping: 15, stiffness: 120, mass: 0.8 },
          });

          const barProgress = interpolate(
            barFrame,
            [0, durationInFrames * 0.5],
            [0, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }
          );

          const heightPercent = (item.value / maxValue) * 100 * barProgress;
          const barColor = item.color || color;

          // Value label animation
          const labelOpacity = interpolate(
            barProgress,
            [0.5, 1],
            [0, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );

          const displayValue = Math.round(item.value * barProgress);

          if (isVertical) {
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: '100%',
                  justifyContent: 'flex-end',
                }}
              >
                {/* Value label */}
                {showValues && (
                  <div
                    style={{
                      fontSize: 24,
                      fontFamily: FONTS.FAMILY,
                      fontWeight: 700,
                      color: '#FFFFFF',
                      marginBottom: 10,
                      opacity: labelOpacity,
                      textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
                    }}
                  >
                    {displayValue}
                  </div>
                )}

                {/* Bar */}
                <div
                  style={{
                    width: barSize,
                    height: `${heightPercent}%`,
                    minHeight: 4,
                    background: `linear-gradient(180deg, ${barColor}, ${barColor}cc)`,
                    borderRadius: '8px 8px 0 0',
                    boxShadow: `
                      0 0 20px ${barColor}44,
                      inset 0 2px 10px rgba(255, 255, 255, 0.2)
                    `,
                    transform: `scaleY(${barSpring})`,
                    transformOrigin: 'bottom',
                  }}
                />

                {/* Label */}
                <div
                  style={{
                    marginTop: 15,
                    fontSize: 18,
                    fontFamily: FONTS.FAMILY,
                    fontWeight: 600,
                    color: '#FFFFFF',
                    textAlign: 'center',
                    opacity: labelOpacity,
                    textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
                  }}
                >
                  {item.label}
                </div>
              </div>
            );
          } else {
            // Horizontal bars
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  width: '100%',
                }}
              >
                {/* Label */}
                <div
                  style={{
                    width: 120,
                    fontSize: 18,
                    fontFamily: FONTS.FAMILY,
                    fontWeight: 600,
                    color: '#FFFFFF',
                    textAlign: 'right',
                    marginRight: 15,
                    opacity: labelOpacity,
                    textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
                  }}
                >
                  {item.label}
                </div>

                {/* Bar */}
                <div
                  style={{
                    flex: 1,
                    height: barSize,
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${heightPercent}%`,
                      minWidth: 4,
                      background: `linear-gradient(90deg, ${barColor}cc, ${barColor})`,
                      borderRadius: '0 8px 8px 0',
                      boxShadow: `
                        0 0 20px ${barColor}44,
                        inset 0 2px 10px rgba(255, 255, 255, 0.2)
                      `,
                      transform: `scaleX(${barSpring})`,
                      transformOrigin: 'left',
                    }}
                  />

                  {/* Value label */}
                  {showValues && (
                    <div
                      style={{
                        position: 'absolute',
                        left: `calc(${heightPercent}% + 15px)`,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: 20,
                        fontFamily: FONTS.FAMILY,
                        fontWeight: 700,
                        color: '#FFFFFF',
                        opacity: labelOpacity,
                        textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
                      }}
                    >
                      {displayValue}
                    </div>
                  )}
                </div>
              </div>
            );
          }
        })}
      </div>
    </div>
  );
};
