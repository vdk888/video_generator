/**
 * SubtitleOverlay - Display subtitles based on word timings
 * Styled per VIDEO_BIBLE.md: 60pt white text, black outline, bottom position
 * Enhanced with spring-based word animations per REMOTION_SKILLS.md
 */

import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { SUBTITLES, FONTS, LAYOUT } from '../brand';
import type { WordTiming } from '../types';

export interface SubtitleOverlayProps {
  wordTimings: WordTiming[];
  startFrame: number;
}

export const SubtitleOverlay: React.FC<SubtitleOverlayProps> = ({
  wordTimings,
  startFrame,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Calculate current time in seconds relative to start
  const currentTime = (frame - startFrame) / fps;

  // Find current word(s) to display (with small lookahead for smoother grouping)
  const currentWords = wordTimings.filter(
    (timing) => currentTime >= timing.start - 0.05 && currentTime <= timing.end + 0.1
  );

  if (currentWords.length === 0) {
    return null;
  }

  // Calculate container fade
  const firstWordStart = currentWords[0].start;
  const lastWordEnd = currentWords[currentWords.length - 1].end;
  const fadeInDuration = 0.08;
  const fadeOutDuration = 0.08;

  let containerOpacity = 1;

  if (currentTime < firstWordStart + fadeInDuration) {
    containerOpacity = interpolate(
      currentTime,
      [firstWordStart, firstWordStart + fadeInDuration],
      [0, 1],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );
  }

  if (currentTime > lastWordEnd - fadeOutDuration) {
    containerOpacity = interpolate(
      currentTime,
      [lastWordEnd - fadeOutDuration, lastWordEnd],
      [1, 0],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );
  }

  // Container spring scale
  const containerScale = spring({
    frame: Math.max(0, frame - Math.floor(firstWordStart * fps)),
    fps,
    config: { damping: 20, stiffness: 200 },
  });

  return (
    <div
      style={{
        position: 'absolute',
        bottom: SUBTITLES.BOTTOM_OFFSET,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: containerOpacity,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          backgroundColor: SUBTITLES.BACKGROUND_COLOR,
          borderRadius: '12px',
          padding: `${SUBTITLES.BACKGROUND_PADDING_V}px ${SUBTITLES.BACKGROUND_PADDING_H}px`,
          fontSize: SUBTITLES.FONT_SIZE,
          fontFamily: FONTS.FAMILY,
          fontWeight: SUBTITLES.FONT_WEIGHT,
          color: SUBTITLES.COLOR,
          textAlign: 'center',
          textShadow: SUBTITLES.TEXT_SHADOW,
          maxWidth: `${LAYOUT.MAX_WIDTH_PERCENT}%`,
          lineHeight: 1.4,
          transform: `scale(${interpolate(containerScale, [0, 1], [0.92, 1])})`,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '0 10px',
        }}
      >
        {currentWords.map((wordTiming, index) => {
          // Calculate word-specific animation based on its timing
          const wordStartFrame = Math.floor(wordTiming.start * fps) + startFrame;
          const wordProgress = Math.max(0, frame - wordStartFrame);

          // Spring for each word entrance
          const wordSpring = spring({
            frame: wordProgress,
            fps,
            config: { damping: 15, stiffness: 180 },
          });

          // Word opacity and position
          const wordOpacity = interpolate(wordSpring, [0, 1], [0.3, 1]);
          const wordTranslateY = interpolate(wordSpring, [0, 1], [8, 0]);

          // Highlight current word with spring-based scale (no CSS transitions!)
          const isCurrentWord = currentTime >= wordTiming.start && currentTime <= wordTiming.end;
          const highlightProgress = isCurrentWord
            ? interpolate(currentTime, [wordTiming.start, wordTiming.start + 0.1], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              })
            : interpolate(currentTime, [wordTiming.end, wordTiming.end + 0.1], [1, 0], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
          const wordScale = interpolate(highlightProgress, [0, 1], [1, 1.05]);

          return (
            <span
              key={`${wordTiming.word}-${index}`}
              style={{
                display: 'inline-block',
                opacity: wordOpacity,
                transform: `translateY(${wordTranslateY}px) scale(${wordScale})`,
              }}
            >
              {wordTiming.word}
            </span>
          );
        })}
      </div>
    </div>
  );
};
