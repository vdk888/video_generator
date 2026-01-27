/**
 * BRollScene - B-roll scene with voiceover and optional subtitles
 * Per VIDEO_BIBLE.md: Video fills 1920x1080, audio voiceover, subtitle overlay
 */

import React from 'react';
import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  staticFile,
  useVideoConfig,
} from 'remotion';
import { SubtitleOverlay } from './SubtitleOverlay';
import type { Scene } from '../types';

export interface BRollSceneProps {
  scene: Scene;
}

export const BRollScene: React.FC<BRollSceneProps> = ({ scene }) => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      {/* Background video */}
      {scene.video.file_path && (
        <OffthreadVideo
          src={staticFile(scene.video.file_path)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      )}

      {/* Voiceover audio */}
      {scene.audio.file_path && (
        <Audio src={staticFile(scene.audio.file_path)} />
      )}

      {/* Subtitles overlay */}
      {scene.audio.word_timings && scene.audio.word_timings.length > 0 && (
        <SubtitleOverlay wordTimings={scene.audio.word_timings} startFrame={0} />
      )}
    </AbsoluteFill>
  );
};
