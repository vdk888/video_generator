/**
 * AvatarScene - HeyGen avatar scene
 * Simple display of the avatar video (includes its own audio)
 */

import React from 'react';
import { AbsoluteFill, OffthreadVideo, staticFile } from 'remotion';
import type { Scene } from '../types';

export interface AvatarSceneProps {
  scene: Scene;
}

export const AvatarScene: React.FC<AvatarSceneProps> = ({ scene }) => {
  return (
    <AbsoluteFill>
      {/* Avatar video with built-in audio */}
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
    </AbsoluteFill>
  );
};
