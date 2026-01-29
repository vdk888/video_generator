/**
 * SceneRouter - Routes a scene to the correct component based on scene_type
 * Simplifies the main BubbleVideo composition
 */

import React from 'react';
import { TitleCard } from './TitleCard';
import { AvatarScene } from './AvatarScene';
import { BRollScene } from './BRollScene';
import { KineticTypography } from './KineticTypography';
import { AnimatedScene } from './AnimatedScene';
import type { Scene } from '../types';
import type { AnimationConfig } from './animations/types';

export interface SceneRouterProps {
  scene: Scene;
}

export const SceneRouter: React.FC<SceneRouterProps> = ({ scene }) => {
  const { scene_type } = scene.script_line;

  switch (scene_type) {
    case 'title':
      return <TitleCard text={scene.script_line.text} />;

    case 'avatar':
      return <AvatarScene scene={scene} />;

    case 'animated':
      // Animated scenes require animation config
      if (scene.script_line.animation) {
        return (
          <AnimatedScene
            scene={scene}
            animation={scene.script_line.animation as AnimationConfig}
          />
        );
      }
      // Fallback to B-roll if no animation config
      console.warn('Animated scene missing animation config, falling back to B-roll');
      return <BRollScene scene={scene} />;

    case 'kinetic':
      // Kinetic typography requires a highlight_word
      if (scene.script_line.highlight_word) {
        return (
          <KineticTypography
            scene={scene}
            highlightWord={scene.script_line.highlight_word}
          />
        );
      }
      // Fallback to B-roll if no highlight word
      return <BRollScene scene={scene} />;

    case 'broll':
    default:
      return <BRollScene scene={scene} />;
  }
};
