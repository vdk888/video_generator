/**
 * BubbleVideoComposition - Main composition orchestrating full video
 *
 * NO TransitionSeries - uses regular Sequences to avoid audio overlap.
 * Visual transitions are handled via opacity fades at scene boundaries.
 */

import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
  useVideoConfig,
  useCurrentFrame,
  interpolate,
} from 'remotion';
import { BrandedIntro } from './BrandedIntro';
import { BrandedOutro } from './BrandedOutro';
import { SceneRouter } from './SceneRouter';
import { COLORS, TIMING, dbToLinear, secondsToFrames } from '../brand';
import type { BubbleVideoInputProps, Scene } from '../types';

export const BubbleVideoComposition: React.FC<BubbleVideoInputProps> = ({
  scenes,
  logo_path,
  background_music_path,
  music_volume,
  config,
}) => {
  const { fps, durationInFrames } = useVideoConfig();

  const introDuration = secondsToFrames(config.timing.intro_duration[0], fps);
  const outroDuration = secondsToFrames(config.timing.outro_duration[0], fps);
  const transitionFrames = secondsToFrames(TIMING.TRANSITION_DURATION, fps); // For visual fade

  // Calculate scene frame durations based on audio
  const sceneDurations = scenes.map((scene) =>
    Math.max(15, Math.ceil(scene.audio.duration * fps))
  );

  // Calculate cumulative start frames - NO OVERLAP
  const sceneStarts: number[] = [];
  let offset = introDuration;
  for (let i = 0; i < scenes.length; i++) {
    sceneStarts.push(offset);
    offset += sceneDurations[i];
  }

  const musicVolumeLinear = dbToLinear(music_volume);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.PRIMARY_TEXT }}>
      {/* Intro */}
      <Sequence durationInFrames={introDuration}>
        <BrandedIntro logoPath={logo_path} duration={introDuration} />
      </Sequence>

      {/* Main scenes - sequential, no overlap */}
      {scenes.map((scene, index) => (
        <Sequence
          key={`scene-${index}`}
          from={sceneStarts[index]}
          durationInFrames={sceneDurations[index]}
        >
          <SceneWithFade
            scene={scene}
            durationInFrames={sceneDurations[index]}
            transitionFrames={transitionFrames}
            isFirst={index === 0}
            isLast={index === scenes.length - 1}
          />
        </Sequence>
      ))}

      {/* Scene audio - sequential, matching scene timing */}
      {scenes.map((scene, index) => {
        const sceneType = scene.script_line.scene_type;

        // Skip: title (no audio), avatar (audio in video component)
        if (sceneType === 'title' || sceneType === 'avatar') {
          return null;
        }

        if (!scene.audio.file_path) {
          return null;
        }

        return (
          <Sequence
            key={`audio-${index}`}
            from={sceneStarts[index]}
            durationInFrames={sceneDurations[index]}
          >
            <Audio src={staticFile(scene.audio.file_path)} volume={1} />
          </Sequence>
        );
      })}

      {/* Outro */}
      <Sequence from={durationInFrames - outroDuration}>
        <BrandedOutro logoPath={logo_path} duration={outroDuration} />
      </Sequence>

      {/* Background music */}
      {background_music_path && (
        <BackgroundMusic
          musicPath={background_music_path}
          volume={musicVolumeLinear}
          totalDurationFrames={durationInFrames}
          scenes={scenes}
          sceneStarts={sceneStarts}
          sceneDurations={sceneDurations}
          fps={fps}
        />
      )}
    </AbsoluteFill>
  );
};

/**
 * SceneWithFade - Wraps scene with opacity fade in/out for smooth transitions
 */
interface SceneWithFadeProps {
  scene: Scene;
  durationInFrames: number;
  transitionFrames: number;
  isFirst: boolean;
  isLast: boolean;
}

const SceneWithFade: React.FC<SceneWithFadeProps> = ({
  scene,
  durationInFrames,
  transitionFrames,
  isFirst,
  isLast,
}) => {
  const frame = useCurrentFrame();

  // Fade in at start (unless first scene after intro)
  const fadeIn = isFirst
    ? 1
    : interpolate(frame, [0, transitionFrames], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });

  // Fade out at end (unless last scene before outro)
  const fadeOut = isLast
    ? 1
    : interpolate(
        frame,
        [durationInFrames - transitionFrames, durationInFrames],
        [1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
      );

  const opacity = Math.min(fadeIn, fadeOut);

  return (
    <AbsoluteFill style={{ opacity }}>
      <SceneRouter scene={scene} />
    </AbsoluteFill>
  );
};

/**
 * BackgroundMusic - Background music with fade in/out and ducking
 */
interface BackgroundMusicProps {
  musicPath: string;
  volume: number;
  totalDurationFrames: number;
  scenes: Scene[];
  sceneStarts: number[];
  sceneDurations: number[];
  fps: number;
}

const BackgroundMusic: React.FC<BackgroundMusicProps> = ({
  musicPath,
  volume: baseVolume,
  totalDurationFrames,
  scenes,
  sceneStarts,
  sceneDurations,
  fps,
}) => {
  const fadeInFrames = Math.round(fps * 1.5);
  const fadeOutFrames = Math.round(fps * 2);

  // Pre-compute scene timeline for ducking
  const sceneTimeline = scenes.map((scene, i) => ({
    start: sceneStarts[i],
    end: sceneStarts[i] + sceneDurations[i],
    type: scene.script_line.scene_type,
  }));

  return (
    <Audio
      src={staticFile(musicPath)}
      volume={(f) => {
        const fadeIn = interpolate(f, [0, fadeInFrames], [0, baseVolume], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const fadeOut = interpolate(
          f,
          [totalDurationFrames - fadeOutFrames, totalDurationFrames],
          [baseVolume, 0],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );

        // Ducking during avatar and kinetic scenes
        let duckFactor = 1.0;
        const rampFrames = 8;
        for (const seg of sceneTimeline) {
          if (seg.type === 'avatar' || seg.type === 'kinetic') {
            const duckDown = interpolate(f, [seg.start - rampFrames, seg.start], [1.0, 0.3], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            const duckUp = interpolate(f, [seg.end, seg.end + rampFrames], [0.3, 1.0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            if (f >= seg.start - rampFrames && f < seg.end + rampFrames) {
              duckFactor = Math.min(duckFactor, Math.min(duckDown, duckUp));
            }
          }
        }

        return Math.min(fadeIn, fadeOut) * duckFactor;
      }}
    />
  );
};
