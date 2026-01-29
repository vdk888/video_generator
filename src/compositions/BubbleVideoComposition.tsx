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
import { TransitionSeries, linearTiming, springTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { wipe } from '@remotion/transitions/wipe';
import { BrandedIntro } from './BrandedIntro';
import { BrandedOutro } from './BrandedOutro';
import { SceneRouter } from './SceneRouter';
import { COLORS, TIMING, dbToLinear, secondsToFrames } from '../brand';
import type { BubbleVideoInputProps, Scene } from '../types';

/**
 * Helper to select transition presentation based on scene type pair
 * Kinetic cuts hard, title cards use wipes/slides for energy
 */
function getTransitionPresentation(
  currentScene: Scene,
  nextScene: Scene,
  width: number,
  height: number,
): any {
  const currentType = currentScene.script_line.scene_type;
  const nextType = nextScene.script_line.scene_type;

  // Kinetic cuts in hard — no transition (use very fast fade as approximation)
  if (nextType === 'kinetic') {
    return fade();
  }

  // Into title card: clean editorial wipe
  if (nextType === 'title') {
    return wipe({ direction: 'from-left' });
  }

  // Out of title card: slide with energy
  if (currentType === 'title') {
    return slide({ direction: 'from-right' });
  }

  // Default: fade
  return fade();
}

export const BubbleVideoComposition: React.FC<BubbleVideoInputProps> = ({
  scenes,
  logo_path,
  background_music_path,
  music_volume,
  config,
}) => {
  const { fps, durationInFrames, width, height } = useVideoConfig();

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
                    presentation={getTransitionPresentation(
                      scenes[index],
                      scenes[index + 1],
                      width,
                      height
                    )}
                    timing={
                      scenes[index + 1].script_line.scene_type === 'kinetic'
                        ? linearTiming({ durationInFrames: Math.round(transitionFrames / 3) }) // Kinetic cuts fast
                        : scenes[index + 1].script_line.scene_type === 'title'
                          ? springTiming({ config: { damping: 200 }, durationInFrames: transitionFrames }) // Smooth for titles
                          : springTiming({ config: { damping: 20, stiffness: 200 }, durationInFrames: transitionFrames }) // Snappy for content
                    }
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
          totalDurationFrames={durationInFrames}
          scenes={scenes}
          sceneDurations={sceneDurations}
          introFrames={introDuration}
          fps={fps}
        />
      )}
    </AbsoluteFill>
  );
};

/**
 * BackgroundMusic - Component for background music with fade in/out and ducking
 * Uses single Audio element with frame-based volume callback
 */
interface BackgroundMusicProps {
  musicPath: string;
  volume: number; // base volume (linear, e.g. 0.1)
  totalDurationFrames: number;
  scenes: Scene[];
  sceneDurations: number[];
  introFrames: number;
  fps: number;
}

const BackgroundMusic: React.FC<BackgroundMusicProps> = ({
  musicPath,
  volume: baseVolume,
  totalDurationFrames,
  scenes,
  sceneDurations,
  introFrames,
  fps,
}) => {
  const fadeInFrames = Math.round(fps * 1.5); // 1.5s fade in
  const fadeOutFrames = Math.round(fps * 2); // 2s fade out

  // Pre-compute scene timeline for ducking
  const sceneTimeline: Array<{ start: number; end: number; type: string }> = [];
  let offset = introFrames;
  for (let i = 0; i < scenes.length; i++) {
    const dur = sceneDurations[i];
    sceneTimeline.push({
      start: offset,
      end: offset + dur,
      type: scenes[i].script_line.scene_type,
    });
    offset += dur;
  }

  return (
    <Audio
      src={staticFile(musicPath)}
      volume={(f) => {
        // Fade in
        const fadeIn = interpolate(f, [0, fadeInFrames], [0, baseVolume], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        // Fade out
        const fadeOut = interpolate(
          f,
          [totalDurationFrames - fadeOutFrames, totalDurationFrames],
          [baseVolume, 0],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );

        // Ducking: reduce volume during avatar and kinetic scenes
        let duckFactor = 1.0;
        const rampFrames = 8;
        for (const seg of sceneTimeline) {
          if (seg.type === 'avatar' || seg.type === 'kinetic') {
            // Ramp down entering ducked scene
            const duckDown = interpolate(f, [seg.start - rampFrames, seg.start], [1.0, 0.3], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            // Ramp up leaving ducked scene
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
