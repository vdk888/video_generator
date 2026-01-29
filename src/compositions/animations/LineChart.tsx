/**
 * Line Chart Animation - Animated line graph drawing
 *
 * Usage in script.json:
 * {
 *   "scene_type": "animated",
 *   "animation": {
 *     "type": "line_chart",
 *     "params": {
 *       "data": [10, 25, 15, 40, 35, 60, 55, 80, 95],
 *       "xLabels": ["2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023"],
 *       "color": "#667eea",
 *       "fill": true,
 *       "animationStyle": "draw"
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
import type { LineChartParams, BaseAnimationProps } from './types';
import { FONTS, COLORS } from '../../brand';

type Props = Omit<LineChartParams, 'type'> & BaseAnimationProps;

export const LineChart: React.FC<Props> = ({
  data,
  xLabels,
  yLabel,
  color = COLORS.ACCENT_VIOLET,
  showDots = true,
  fill = false,
  animationStyle = 'draw',
  durationInFrames,
  delayFrames = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const adjustedFrame = Math.max(0, frame - delayFrames);

  // Normalize data to y values
  const yValues = Array.isArray(data[0])
    ? (data as [number, number][]).map(d => d[1])
    : (data as number[]);

  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  const range = maxY - minY || 1;

  // Chart dimensions
  const chartWidth = 900;
  const chartHeight = 400;
  const padding = { top: 40, right: 40, bottom: 60, left: 80 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Calculate points
  const points = yValues.map((y, i) => ({
    x: padding.left + (i / (yValues.length - 1)) * innerWidth,
    y: padding.top + innerHeight - ((y - minY) / range) * innerHeight,
    value: y,
  }));

  // Animation progress
  const drawProgress = interpolate(
    adjustedFrame,
    [0, durationInFrames * 0.7],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }
  );

  // Create SVG path
  const createPath = (pts: typeof points, progress: number) => {
    const visiblePoints = Math.ceil(pts.length * progress);
    if (visiblePoints < 2) return '';

    const pathPoints = pts.slice(0, visiblePoints);

    // Interpolate last point for smooth animation
    if (progress < 1 && visiblePoints < pts.length) {
      const lastFullIndex = visiblePoints - 1;
      const nextIndex = Math.min(visiblePoints, pts.length - 1);
      const localProgress = (progress * pts.length) % 1;

      if (lastFullIndex < pts.length - 1) {
        const interpolatedX = interpolate(localProgress, [0, 1], [pts[lastFullIndex].x, pts[nextIndex].x]);
        const interpolatedY = interpolate(localProgress, [0, 1], [pts[lastFullIndex].y, pts[nextIndex].y]);
        pathPoints.push({ x: interpolatedX, y: interpolatedY, value: 0 });
      }
    }

    let d = `M ${pathPoints[0].x} ${pathPoints[0].y}`;
    for (let i = 1; i < pathPoints.length; i++) {
      // Smooth curve using quadratic bezier
      const prev = pathPoints[i - 1];
      const curr = pathPoints[i];
      const cpX = (prev.x + curr.x) / 2;
      d += ` Q ${prev.x + (curr.x - prev.x) * 0.5} ${prev.y}, ${cpX} ${(prev.y + curr.y) / 2}`;
      d += ` T ${curr.x} ${curr.y}`;
    }
    return d;
  };

  // Create fill path (closed)
  const createFillPath = (pts: typeof points, progress: number) => {
    const linePath = createPath(pts, progress);
    if (!linePath) return '';

    const visiblePoints = Math.ceil(pts.length * progress);
    const lastX = pts[Math.min(visiblePoints - 1, pts.length - 1)].x +
      (progress < 1 ? ((progress * pts.length) % 1) * (innerWidth / (pts.length - 1)) : 0);

    return `${linePath} L ${Math.min(lastX, padding.left + innerWidth)} ${padding.top + innerHeight} L ${padding.left} ${padding.top + innerHeight} Z`;
  };

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
      <svg width={chartWidth} height={chartHeight} style={{ overflow: 'visible' }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <line
            key={`grid-${i}`}
            x1={padding.left}
            y1={padding.top + innerHeight * ratio}
            x2={padding.left + innerWidth}
            y2={padding.top + innerHeight * ratio}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={1}
          />
        ))}

        {/* Fill area */}
        {fill && (
          <path
            d={createFillPath(points, drawProgress)}
            fill={`${color}33`}
          />
        )}

        {/* Line */}
        <path
          d={createPath(points, drawProgress)}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            filter: `drop-shadow(0 0 10px ${color}88)`,
          }}
        />

        {/* Dots */}
        {showDots && points.map((point, i) => {
          const dotProgress = interpolate(
            drawProgress,
            [(i / points.length) * 0.9, (i / points.length) * 0.9 + 0.1],
            [0, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );

          if (dotProgress === 0) return null;

          return (
            <circle
              key={`dot-${i}`}
              cx={point.x}
              cy={point.y}
              r={8 * dotProgress}
              fill={color}
              stroke="#FFFFFF"
              strokeWidth={3}
              style={{
                filter: `drop-shadow(0 0 8px ${color})`,
              }}
            />
          );
        })}

        {/* X-axis labels */}
        {xLabels && xLabels.map((label, i) => {
          const labelOpacity = interpolate(
            drawProgress,
            [(i / xLabels.length) * 0.8, (i / xLabels.length) * 0.8 + 0.2],
            [0, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );

          return (
            <text
              key={`label-${i}`}
              x={padding.left + (i / (xLabels.length - 1)) * innerWidth}
              y={chartHeight - 15}
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize={16}
              fontFamily={FONTS.FAMILY}
              opacity={labelOpacity}
            >
              {label}
            </text>
          );
        })}

        {/* Y-axis label */}
        {yLabel && (
          <text
            x={20}
            y={chartHeight / 2}
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize={18}
            fontFamily={FONTS.FAMILY}
            transform={`rotate(-90, 20, ${chartHeight / 2})`}
            opacity={containerOpacity}
          >
            {yLabel}
          </text>
        )}
      </svg>
    </div>
  );
};
