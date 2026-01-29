/**
 * DemoWithBranding - Complete demo video composition
 * Features:
 * - Branded intro (3s)
 * - Demo video at 1.15x speed with voiceover chunks
 * - Background music with dynamic ducking (50% normally, 15% when voice plays)
 * - Branded outro (3s)
 * - Crossfade transitions
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  AbsoluteFill,
  Audio,
  Video,
  Sequence,
  staticFile,
  useVideoConfig,
  useCurrentFrame,
  interpolate,
} from 'remotion';
import { BrandedIntro } from './BrandedIntro';
import { BrandedOutro } from './BrandedOutro';

interface VoiceoverChunk {
  id: string;
  text: string;
  audio: string;
  duration: number;
  startTime: number;
}

interface DemoData {
  video: { path: string; duration: number };
  chunks: VoiceoverChunk[];
}

const PLAYBACK_RATE = 1.15;
const INTRO_DURATION_SEC = 3;
const OUTRO_DURATION_SEC = 6; // Extended to accommodate logo animation (~5s)
const TRANSITION_FRAMES = 15; // crossfade duration
const MUSIC_VOLUME_HIGH = 0.5; // when no voice is playing
const MUSIC_VOLUME_LOW = 0.15; // when voice is playing (ducked)
const DUCK_FADE_FRAMES = 10; // frames to fade in/out ducking

export const DemoWithBranding: React.FC = () => {
  const { fps } = useVideoConfig();
  const [data, setData] = useState<DemoData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(staticFile('voiceover_chunks.json'))
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <AbsoluteFill style={{ backgroundColor: '#1a1a2e', color: 'white', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 20 }}>
        <h2>Error loading voiceover_chunks.json</h2>
        <p>{error}</p>
      </AbsoluteFill>
    );
  }

  if (!data) {
    return (
      <AbsoluteFill style={{ backgroundColor: '#1a1a2e', color: 'white', justifyContent: 'center', alignItems: 'center' }}>
        <p>Loading...</p>
      </AbsoluteFill>
    );
  }

  const introFrames = Math.round(INTRO_DURATION_SEC * fps);
  const outroFrames = Math.round(OUTRO_DURATION_SEC * fps);

  // Video duration at 1.15x speed
  const videoDurationAtSpeed = data.video.duration / PLAYBACK_RATE;
  const videoFrames = Math.round(videoDurationAtSpeed * fps);

  const totalFrames = introFrames + videoFrames + outroFrames;

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      {/* Background music with dynamic ducking */}
      <DynamicMusic
        data={data}
        introFrames={introFrames}
        transitionFrames={TRANSITION_FRAMES}
        fps={fps}
      />

      {/* INTRO SEQUENCE */}
      <Sequence from={0} durationInFrames={introFrames + TRANSITION_FRAMES}>
        <IntroWithFade introFrames={introFrames} transitionFrames={TRANSITION_FRAMES} />
      </Sequence>

      {/* MAIN DEMO VIDEO */}
      <Sequence from={introFrames - TRANSITION_FRAMES} durationInFrames={videoFrames + TRANSITION_FRAMES * 2}>
        <DemoContent
          data={data}
          introFrames={introFrames}
          transitionFrames={TRANSITION_FRAMES}
          fps={fps}
        />
      </Sequence>

      {/* OUTRO SEQUENCE */}
      <Sequence from={introFrames + videoFrames - TRANSITION_FRAMES} durationInFrames={outroFrames + TRANSITION_FRAMES}>
        <OutroWithFade
          outroFrames={outroFrames}
          transitionFrames={TRANSITION_FRAMES}
        />
      </Sequence>
    </AbsoluteFill>
  );
};

// Dynamic music component with ducking based on voiceover
const DynamicMusic: React.FC<{
  data: DemoData;
  introFrames: number;
  transitionFrames: number;
  fps: number;
}> = ({ data, introFrames, transitionFrames, fps }) => {
  const frame = useCurrentFrame();

  // Pre-calculate voice active ranges (in absolute frames from start of composition)
  const voiceRanges = useMemo(() => {
    return data.chunks.map((chunk) => {
      // Adjust start time for playback speed
      const adjustedStartTime = chunk.startTime / PLAYBACK_RATE;
      // Add intro frames offset to get absolute frame position
      const startFrame = introFrames + Math.round(adjustedStartTime * fps) + transitionFrames;
      const endFrame = startFrame + Math.round(chunk.duration * fps);
      return { start: startFrame, end: endFrame };
    });
  }, [data.chunks, introFrames, fps, transitionFrames]);

  // Check if any voice is active at current frame (with fade padding)
  const isVoiceActive = voiceRanges.some(
    (range) => frame >= range.start - DUCK_FADE_FRAMES && frame <= range.end + DUCK_FADE_FRAMES
  );

  // Calculate smooth volume transition
  let volume = MUSIC_VOLUME_HIGH;

  for (const range of voiceRanges) {
    // Fade down before voice starts
    if (frame >= range.start - DUCK_FADE_FRAMES && frame < range.start) {
      const fadeProgress = (frame - (range.start - DUCK_FADE_FRAMES)) / DUCK_FADE_FRAMES;
      volume = Math.min(volume, interpolate(fadeProgress, [0, 1], [MUSIC_VOLUME_HIGH, MUSIC_VOLUME_LOW]));
    }
    // During voice
    else if (frame >= range.start && frame <= range.end) {
      volume = MUSIC_VOLUME_LOW;
    }
    // Fade up after voice ends
    else if (frame > range.end && frame <= range.end + DUCK_FADE_FRAMES) {
      const fadeProgress = (frame - range.end) / DUCK_FADE_FRAMES;
      const targetVolume = interpolate(fadeProgress, [0, 1], [MUSIC_VOLUME_LOW, MUSIC_VOLUME_HIGH]);
      // Only apply if no other voice is starting soon
      const nextVoiceStartsSoon = voiceRanges.some(
        (r) => r.start > range.end && frame >= r.start - DUCK_FADE_FRAMES
      );
      if (!nextVoiceStartsSoon) {
        volume = Math.min(volume, targetVolume);
      } else {
        volume = MUSIC_VOLUME_LOW;
      }
    }
  }

  return (
    <Audio
      src={staticFile('chillout_focus.mp3')}
      volume={volume}
      startFrom={0}
    />
  );
};

// Intro with fade out
const IntroWithFade: React.FC<{ introFrames: number; transitionFrames: number }> = ({ introFrames, transitionFrames }) => {
  return (
    <AbsoluteFill>
      <BrandedIntro duration={introFrames} />
    </AbsoluteFill>
  );
};

// Demo content with video and voiceover
const DemoContent: React.FC<{
  data: DemoData;
  introFrames: number;
  transitionFrames: number;
  fps: number;
}> = ({ data, introFrames, transitionFrames, fps }) => {
  const { video, chunks } = data;

  return (
    <AbsoluteFill>
      {/* Demo video at 1.15x speed */}
      <Video
        src={staticFile(video.path)}
        playbackRate={PLAYBACK_RATE}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
      />

      {/* Voiceover chunks - adjusted for speed */}
      {chunks.map((chunk) => {
        // Adjust start time for playback speed
        const adjustedStartTime = chunk.startTime / PLAYBACK_RATE;
        const startFrame = Math.round(adjustedStartTime * fps) + transitionFrames;
        const durationFrames = Math.round(chunk.duration * fps);

        return (
          <Sequence key={chunk.id} from={startFrame} durationInFrames={durationFrames}>
            <Audio src={staticFile(chunk.audio)} volume={1} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

// Outro with fade in
const OutroWithFade: React.FC<{ outroFrames: number; transitionFrames: number }> = ({ outroFrames, transitionFrames }) => {
  return (
    <AbsoluteFill>
      <BrandedOutro
        logoVideoPath="logo_anim.mp4"
        ctaText="Bubble Analyst - Votre intelligence investissement"
        duration={outroFrames}
      />
    </AbsoluteFill>
  );
};

export default DemoWithBranding;
