/**
 * AvatarScene - HeyGen avatar scene with embedded audio
 * Audio is part of the video file (lip-synced), so we play it WITH the video.
 * Audio fades in/out during transitions to avoid harsh overlaps.
 */

import React from 'react';
import {
  AbsoluteFill,
  OffthreadVideo,
  staticFile,
  useVideoConfig,
  interpolate,
} from 'remotion';
import type { Scene } from '../types';

export interface AvatarSceneProps {
  scene: Scene;
}

export const AvatarScene: React.FC<AvatarSceneProps> = ({ scene }) => {
  const { fps } = useVideoConfig();
  const sceneDurationFrames = Math.ceil(scene.audio.duration * fps);

  return (
    <AbsoluteFill>
      {/* Avatar video with embedded audio - fades for smooth transitions */}
      {scene.video.file_path && (
        <OffthreadVideo
          src={staticFile(scene.video.file_path)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          volume={(f) => {
            // Fade in over first 10 frames
            const fadeIn = interpolate(f, [0, 10], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            // Fade out over last 10 frames
            const fadeOutStart = Math.max(0, sceneDurationFrames - 10);
            const fadeOut = interpolate(f, [fadeOutStart, sceneDurationFrames], [1, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            return Math.min(fadeIn, fadeOut);
          }}
        />
      )}
    </AbsoluteFill>
  );
};
