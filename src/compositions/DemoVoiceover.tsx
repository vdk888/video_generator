/**
 * Demo Voiceover Composition
 * Overlays voiceover chunks on a demo video
 * Edit public/voiceover_chunks.json to adjust timing (startTime for each chunk)
 */

import { AbsoluteFill, Audio, Video, Sequence, staticFile, useVideoConfig } from 'remotion';
import { useEffect, useState } from 'react';

interface VoiceoverChunk {
  id: string;
  text: string;
  audio: string;
  duration: number;
  startTime: number; // in seconds - edit this in voiceover_chunks.json to move chunks
}

interface VoiceoverData {
  video: { path: string; duration: number };
  chunks: VoiceoverChunk[];
}

export const DemoVoiceover: React.FC<{ data: VoiceoverData }> = ({ data }) => {
  const { fps } = useVideoConfig();
  const { video, chunks } = data;

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      {/* Background video */}
      <Video
        src={staticFile(video.path)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
      />

      {/* Voiceover audio chunks - each positioned by startTime */}
      {chunks.map((chunk) => {
        const startFrame = Math.round(chunk.startTime * fps);
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

/**
 * Wrapper that loads chunks from JSON
 */
export const DemoVoiceoverFromFile: React.FC = () => {
  const [data, setData] = useState<VoiceoverData | null>(null);
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
        <p style={{ opacity: 0.6 }}>Make sure public/voiceover_chunks.json exists</p>
      </AbsoluteFill>
    );
  }

  if (!data) {
    return (
      <AbsoluteFill style={{ backgroundColor: '#1a1a2e', color: 'white', justifyContent: 'center', alignItems: 'center' }}>
        <p>Loading voiceover_chunks.json...</p>
      </AbsoluteFill>
    );
  }

  return <DemoVoiceover data={data} />;
};

export default DemoVoiceoverFromFile;
