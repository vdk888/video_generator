/**
 * BubbleVideoComposition - Main composition orchestrating full video
 * Uses TransitionSeries for scene transitions, overlays background music
 * Renders: BrandedIntro → scene sequences → BrandedOutro
 */

import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
  useVideoConfig,
  interpolate,
} from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { BrandedIntro } from './BrandedIntro';
import { BrandedOutro } from './BrandedOutro';
import { SceneRouter } from './SceneRouter';
import { COLORS, TIMING, dbToLinear, secondsToFrames } from '../brand';
import type { BubbleVideoInputProps } from '../types';

export const BubbleVideoComposition: React.FC<BubbleVideoInputProps> = ({
  scenes,
  logo_path,
  background_music_path,
  music_volume,
  config,
}) => {
  const { fps, durationInFrames } = useVideoConfig();

  // Calculate durations using brand constants
  const introDuration = secondsToFrames(config.timing.intro_duration[0], fps); // 3s default
  const outroDuration = secondsToFrames(config.timing.outro_duration[0], fps); // 3s default

  // Transition duration from brand constants: 0.4s = 10 frames at 25fps
  const transitionFrames = secondsToFrames(TIMING.TRANSITION_DURATION, fps);

  // Minimum scene duration: must be longer than transition
  const minSceneFrames = transitionFrames + 5;

  // Calculate scene frame durations (enforce minimum)
  const sceneDurations = scenes.map((scene) =>
    Math.max(minSceneFrames, Math.ceil(scene.audio.duration * fps))
  );

  // Calculate music volume using brand helper (convert dB to linear scale)
  // -20dB ≈ 0.1 volume
  const musicVolumeLinear = dbToLinear(music_volume);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.PRIMARY_TEXT }}>
      {/* Intro */}
      <Sequence durationInFrames={introDuration}>
        <BrandedIntro logoPath={logo_path} duration={introDuration} />
      </Sequence>

      {/* Main content with transitions */}
      {scenes.length > 0 && (
        <Sequence from={introDuration}>
          <TransitionSeries>
            {scenes.map((scene, index) => (
              <React.Fragment key={index}>
                <TransitionSeries.Sequence durationInFrames={sceneDurations[index]}>
                  <SceneRouter scene={scene} />
                </TransitionSeries.Sequence>
                {index < scenes.length - 1 && (
                  <TransitionSeries.Transition
                    presentation={fade()}
                    timing={linearTiming({ durationInFrames: transitionFrames })}
                  />
                )}
              </React.Fragment>
            ))}
          </TransitionSeries>
        </Sequence>
      )}

      {/* Outro */}
      <Sequence from={durationInFrames - outroDuration}>
        <BrandedOutro logoPath={logo_path} duration={outroDuration} />
      </Sequence>

      {/* Background music with volume ducking and fades */}
      {background_music_path && (
        <BackgroundMusic
          musicPath={background_music_path}
          volume={musicVolumeLinear}
          durationInFrames={durationInFrames}
          fps={fps}
        />
      )}
    </AbsoluteFill>
  );
};

/**
 * BackgroundMusic - Component for background music with fade in/out
 */
interface BackgroundMusicProps {
  musicPath: string;
  volume: number;
  durationInFrames: number;
  fps: number;
}

const BackgroundMusic: React.FC<BackgroundMusicProps> = ({
  musicPath,
  volume,
  durationInFrames,
  fps,
}) => {
  const frame = React.useRef(0);

  // Fade duration from brand constants: 2 seconds (50 frames at 25fps)
  const fadeDuration = secondsToFrames(TIMING.MUSIC_FADE_DURATION, fps);

  // Calculate dynamic volume based on frame
  const getDynamicVolume = (currentFrame: number): number => {
    // Fade in
    if (currentFrame < fadeDuration) {
      const fadeInProgress = interpolate(
        currentFrame,
        [0, fadeDuration],
        [0, 1],
        { extrapolateRight: 'clamp' }
      );
      return volume * fadeInProgress;
    }

    // Fade out
    const fadeOutStart = durationInFrames - fadeDuration;
    if (currentFrame > fadeOutStart) {
      const fadeOutProgress = interpolate(
        currentFrame,
        [fadeOutStart, durationInFrames],
        [1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
      );
      return volume * fadeOutProgress;
    }

    // Normal volume
    return volume;
  };

  // Note: Remotion's Audio component doesn't support dynamic volume changes per frame
  // We'll use a constant volume here, and handle fade in/out via multiple Audio sequences

  return (
    <>
      {/* Fade in segment */}
      <Sequence durationInFrames={fadeDuration}>
        <Audio
          src={staticFile(musicPath)}
          volume={(f) =>
            interpolate(f, [0, fadeDuration], [0, volume], {
              extrapolateRight: 'clamp',
            })
          }
        />
      </Sequence>

      {/* Full volume segment */}
      <Sequence
        from={fadeDuration}
        durationInFrames={durationInFrames - 2 * fadeDuration}
      >
        <Audio
          src={staticFile(musicPath)}
          volume={volume}
          startFrom={Math.floor(fadeDuration)}
        />
      </Sequence>

      {/* Fade out segment */}
      <Sequence from={durationInFrames - fadeDuration}>
        <Audio
          src={staticFile(musicPath)}
          volume={(f) =>
            interpolate(f, [0, fadeDuration], [volume, 0], {
              extrapolateRight: 'clamp',
            })
          }
          startFrom={Math.floor(durationInFrames - fadeDuration)}
        />
      </Sequence>
    </>
  );
};
