/**
 * TypeScript type definitions for Bubble Video Engine
 * Ported from Python models.py
 */

// Scene Types
export type SceneType = 'broll' | 'avatar' | 'title' | 'kinetic';
export type LineType = 'speech' | 'title';
export type TTSProvider = 'openai' | 'elevenlabs' | 'edge';

/**
 * Represents a single line in the script with associated metadata
 * Python equivalent: ScriptLine dataclass
 */
export interface ScriptLine {
  text: string;
  type: LineType;
  search_query?: string;
  highlight_word?: string | null;
  scene_type: SceneType;
  custom_media_path?: string | null;
  voice_id?: string | null;
}

/**
 * Represents word-level timing data for subtitles
 */
export interface WordTiming {
  word: string;
  start: number; // seconds
  end: number; // seconds
}

/**
 * Audio asset with timing and subtitle information
 * Python equivalent: AudioAsset dataclass
 */
export interface AudioAsset {
  file_path: string;
  duration: number;
  subtitle_path?: string | null;
  word_timings?: WordTiming[] | null;
}

/**
 * Video asset with dimensions
 * Python equivalent: VideoAsset dataclass
 */
export interface VideoAsset {
  file_path: string;
  width: number;
  height: number;
  duration?: number; // Optional duration in seconds
}

/**
 * Complete scene combining script, audio, and video
 * Python equivalent: Scene dataclass
 */
export interface Scene {
  script_line: ScriptLine;
  audio: AudioAsset;
  video: VideoAsset;
  output_path: string;
}

/**
 * Timing configuration from VIDEO_BIBLE.md
 */
export interface TimingConfig {
  intro_duration: [number, number]; // [min, max] in seconds
  hook_duration: [number, number];
  title_card_duration: [number, number];
  speech_segment_duration: [number, number];
  highlight_duration: [number, number];
  recap_duration: [number, number];
  outro_duration: [number, number];
  total_target: [number, number];
  words_per_minute: number;
  transition_duration: number;
}

/**
 * Visual configuration from VIDEO_BIBLE.md
 */
export interface VisualConfig {
  resolution: [number, number]; // [width, height]
  framerate: number;
  pixel_format: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  fonts: {
    title: string;
    subtitle: string;
    kinetic: string;
  };
  kinetic_typography: {
    font_size: number;
    background_dim: number;
    frequency: number;
  };
}

/**
 * Audio configuration from VIDEO_BIBLE.md
 */
export interface AudioConfig {
  tts_provider: TTSProvider;
  tts_voice: string;
  sample_rate: number;
  channels: number;
  background_music_volume: number; // dB
  music_style: string;
}

/**
 * Project configuration (environment + settings)
 * Python equivalent: ProjectConfig dataclass
 */
export interface ProjectConfig {
  // Directory paths
  assets_dir: string;
  final_video_path: string;
  music_dir: string;

  // API Keys (required)
  pexels_api_key: string;
  openrouter_api_key: string;

  // API Keys (optional)
  elevenlabs_api_key?: string;
  heygen_api_key?: string;

  // Service configuration
  openrouter_model: string;
  tts_provider: TTSProvider;
  elevenlabs_voice_id?: string;
  heygen_default_avatar_id: string;
  heygen_default_voice_id: string;

  // Feature flags
  enable_background_music: boolean;
  music_mood: string;

  // Branding assets
  logo_path?: string | null;
  intro_video_path?: string | null;
  outro_video_path?: string | null;

  // Video Bible configs
  timing: TimingConfig;
  visual: VisualConfig;
  audio: AudioConfig;
}

/**
 * Input props for the main Remotion composition
 * This is what gets passed to the BubbleVideo component
 */
export interface BubbleVideoInputProps {
  // Core content
  scenes: Scene[];

  // Branding
  logo_path?: string | null;
  intro_video_path?: string | null;
  outro_video_path?: string | null;

  // Audio
  background_music_path?: string | null;
  music_volume: number; // dB

  // Configuration
  config: ProjectConfig;
}

/**
 * Metadata for dynamic composition configuration
 */
export interface BubbleVideoMetadata {
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
}
