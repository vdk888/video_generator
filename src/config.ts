/**
 * Configuration loader for Bubble Video Engine
 * Ported from Python src/infra/config.py
 *
 * Loads environment variables and provides typed configuration
 */

import { config as dotenvConfig } from 'dotenv';
import { z } from 'zod';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import type {
  ProjectConfig,
  TimingConfig,
  VisualConfig,
  AudioConfig,
  TTSProvider,
} from './types.js';

// Load .env file from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

dotenvConfig({ path: path.join(rootDir, '.env') });

/**
 * Zod schema for environment variables validation
 */
const envSchema = z.object({
  // Required
  PEXELS_API_KEY: z.string().min(1, 'PEXELS_API_KEY is required'),
  OPENROUTER_API_KEY: z.string().min(1, 'OPENROUTER_API_KEY is required'),

  // Optional with defaults
  OPENROUTER_MODEL: z.string().default('gpt-4o-mini'),
  TTS_PROVIDER: z.enum(['openai', 'elevenlabs', 'edge']).default('openai'),
  ENABLE_BACKGROUND_MUSIC: z
    .string()
    .transform((val) => val.toLowerCase() === 'true')
    .default('true'),
  MUSIC_MOOD: z.string().default('ambient_cinematic'),

  // Optional (no defaults)
  ELEVENLABS_API_KEY: z.string().optional(),
  ELEVENLABS_VOICE_ID: z.string().optional(),
  HEYGEN_API_KEY: z.string().optional(),
  HEYGEN_DEFAULT_AVATAR_ID: z.string().default('Angela-inblackskirt-20220820'),
  HEYGEN_DEFAULT_VOICE_ID: z.string().default('1bd001e7e50f421d891986aad5158bc8'),
});

type EnvSchema = z.infer<typeof envSchema>;

/**
 * Parse and validate environment variables
 */
function loadEnv(): EnvSchema {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Environment variable validation failed:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      throw new Error('Invalid environment configuration');
    }
    throw error;
  }
}

/**
 * VIDEO_BIBLE.md timing configuration
 */
const TIMING_CONFIG: TimingConfig = {
  intro_duration: [3, 5],
  hook_duration: [10, 30],
  title_card_duration: [2, 3],
  speech_segment_duration: [4, 8],
  highlight_duration: [2, 3],
  recap_duration: [10, 15],
  outro_duration: [3, 5],
  total_target: [180, 480],
  words_per_minute: 150,
  transition_duration: 0.4,
};

/**
 * VIDEO_BIBLE.md visual configuration
 */
const VISUAL_CONFIG: VisualConfig = {
  resolution: [1920, 1080],
  framerate: 25,
  pixel_format: 'yuv420p',
  colors: {
    primary: '#FFFFFF',
    secondary: '#000000',
    accent: '#667eea',
  },
  fonts: {
    title: 'Inter-ExtraBold',
    subtitle: 'Inter',
    kinetic: 'Inter-ExtraBold',
  },
  kinetic_typography: {
    font_size: 170,
    background_dim: -0.4,
    frequency: 0.2,
  },
};

/**
 * VIDEO_BIBLE.md audio configuration
 */
function buildAudioConfig(env: EnvSchema): AudioConfig {
  return {
    tts_provider: env.TTS_PROVIDER,
    tts_voice: env.TTS_PROVIDER === 'elevenlabs'
      ? env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL'
      : 'alloy',
    sample_rate: 48000,
    channels: 2,
    background_music_volume: -20,
    music_style: env.MUSIC_MOOD,
  };
}

/**
 * Load project configuration
 *
 * @param projectName - Name of the project (creates isolated folder)
 * @returns Complete project configuration
 */
export function loadConfig(projectName: string = 'default'): ProjectConfig {
  const env = loadEnv();

  // Project directory structure: projects/{projectName}
  const projectDir = path.join(rootDir, 'projects', projectName);
  const assetsDir = path.join(projectDir, 'assets');

  // Create directories if they don't exist
  if (!fs.existsSync(projectDir)) {
    fs.mkdirSync(projectDir, { recursive: true });
  }
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  // Branding asset paths (from VIDEO_BIBLE.md)
  const logoPath = path.join(rootDir, 'assets', 'logo.png');
  const outroVideo = path.join(rootDir, 'vidu-video-3072694396319459.mov');
  const musicDir = path.join(rootDir, 'assets', 'music');

  return {
    // Directory paths
    assets_dir: assetsDir,
    final_video_path: path.join(projectDir, 'final_output.mp4'),
    music_dir: musicDir,

    // API Keys (required)
    pexels_api_key: env.PEXELS_API_KEY,
    openrouter_api_key: env.OPENROUTER_API_KEY,

    // API Keys (optional)
    elevenlabs_api_key: env.ELEVENLABS_API_KEY,
    heygen_api_key: env.HEYGEN_API_KEY,

    // Service configuration
    openrouter_model: env.OPENROUTER_MODEL,
    tts_provider: env.TTS_PROVIDER as TTSProvider,
    elevenlabs_voice_id: env.ELEVENLABS_VOICE_ID,
    heygen_default_avatar_id: env.HEYGEN_DEFAULT_AVATAR_ID,
    heygen_default_voice_id: env.HEYGEN_DEFAULT_VOICE_ID,

    // Feature flags
    enable_background_music: env.ENABLE_BACKGROUND_MUSIC,
    music_mood: env.MUSIC_MOOD,

    // Branding assets
    logo_path: fs.existsSync(logoPath) ? logoPath : null,
    intro_video_path: null, // Generated dynamically
    outro_video_path: fs.existsSync(outroVideo) ? outroVideo : null,

    // Video Bible configs
    timing: TIMING_CONFIG,
    visual: VISUAL_CONFIG,
    audio: buildAudioConfig(env),
  };
}

/**
 * Export environment for direct access if needed
 */
export const env = loadEnv();
