/**
 * Video Generation Orchestrator
 * Main pipeline that coordinates all services and renders the final video
 * TypeScript port of Python src/app/use_cases.py
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadConfig } from './config.js';
import { renderVideo } from './render.js';
import { getAudioDuration } from './utils/audio.js';
import { getVideoDuration, getVideoDimensions } from './utils/video.js';
import type {
  ScriptLine,
  Scene,
  ProjectConfig,
  BubbleVideoInputProps,
  AudioAsset,
  VideoAsset,
} from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Project root directory */
function rootDir(): string {
  return path.resolve(__dirname, '..');
}

// Import services
import * as OpenRouter from './services/openrouter.js';
import * as OpenAITTS from './services/openai-tts.js';
import * as ElevenLabs from './services/elevenlabs.js';
import * as EdgeTTS from './services/edge-tts.js';
import * as HeyGen from './services/heygen.js';
import * as Pexels from './services/pexels.js';
import * as Music from './services/music.js';

/**
 * Main video generation pipeline
 *
 * Pipeline steps:
 * 1. Load config from .env
 * 2. Check if script.json exists → if yes, use it (Director Mode); if no, generate from raw_source.txt
 * 3. Save script.json
 * 4. Create output directories
 * 5. Process each ScriptLine:
 *    - title: no assets needed
 *    - avatar: call HeyGen → get video
 *    - broll: call TTS + Pexels in parallel → get audio + video
 * 6. Select background music track (if enabled)
 * 7. Build InputProps for Remotion
 * 8. Call Remotion renderer
 * 9. Return path to final video
 *
 * @param projectName - Project name for isolation (default: "default")
 * @returns Path to final rendered video
 */
export async function generateVideo(projectName: string = 'default'): Promise<string> {
  console.log('\n🎬 Bubble Video Engine - TypeScript Orchestrator\n');
  console.log(`Project: ${projectName}`);
  console.log('─'.repeat(60));

  const startTime = Date.now();

  // Step 1: Load configuration
  console.log('\n📋 Step 1: Loading configuration...');
  const config = loadConfig(projectName);
  console.log(`   Assets dir: ${config.assets_dir}`);
  console.log(`   Final output: ${config.final_video_path}`);
  console.log(`   TTS provider: ${config.tts_provider}`);
  console.log(`   Background music: ${config.enable_background_music ? 'enabled' : 'disabled'}`);

  // Step 2: Load or generate script
  console.log('\n📝 Step 2: Loading/generating script...');
  const projectDir = path.dirname(config.final_video_path);
  const scriptJsonPath = path.join(projectDir, 'script.json');
  const rawSourcePath = path.join(projectDir, 'raw_source.txt');

  let scriptLines: ScriptLine[];

  if (await fileExists(scriptJsonPath)) {
    // Director Mode: use existing script
    console.log(`   ✅ Found existing script.json (Director Mode)`);
    const scriptData = JSON.parse(await fs.readFile(scriptJsonPath, 'utf-8'));
    scriptLines = parseScriptJson(scriptData);
    console.log(`   Loaded ${scriptLines.length} script lines`);
  } else if (await fileExists(rawSourcePath)) {
    // Generate script from raw text
    console.log(`   📖 Reading raw source from raw_source.txt...`);
    const rawText = await fs.readFile(rawSourcePath, 'utf-8');
    console.log(`   🤖 Generating structured script via LLM...`);

    scriptLines = await OpenRouter.generateScript(rawText, config);

    // Save generated script
    await fs.writeFile(
      scriptJsonPath,
      JSON.stringify(scriptLines, null, 2),
      'utf-8'
    );
    console.log(`   ✅ Script saved to script.json (${scriptLines.length} lines)`);
  } else {
    throw new Error(
      `No script found! Please create either:\n` +
        `  - ${scriptJsonPath} (structured script)\n` +
        `  - ${rawSourcePath} (raw text for LLM generation)`
    );
  }

  // Step 3: Create output directories
  console.log('\n📁 Step 3: Creating output directories...');
  await ensureDir(config.assets_dir);
  await ensureDir(path.join(config.assets_dir, 'audio'));
  await ensureDir(path.join(config.assets_dir, 'video'));

  // Create public/ symlink so Remotion can serve project assets
  const publicDir = path.join(rootDir(), 'public');
  const projectAssetsLink = path.join(publicDir, 'project-assets');
  await ensureDir(publicDir);
  try {
    await fs.unlink(projectAssetsLink);
  } catch { /* doesn't exist yet */ }
  await fs.symlink(config.assets_dir, projectAssetsLink);

  console.log('   ✅ Directories ready');

  // Step 4: Process script lines to generate scenes
  console.log('\n🎨 Step 4: Processing script lines...');
  const scenes: Scene[] = [];

  for (let i = 0; i < scriptLines.length; i++) {
    const line = scriptLines[i];
    console.log(`\n   [${i + 1}/${scriptLines.length}] ${line.type}: "${line.text.slice(0, 40)}..."`);

    const scene = await processScriptLine(line, i, config);
    scenes.push(scene);
  }

  console.log(`\n   ✅ Processed ${scenes.length} scenes`);

  // Step 5: Select background music
  console.log('\n🎵 Step 5: Selecting background music...');
  let backgroundMusicPath: string | null = null;

  if (config.enable_background_music) {
    try {
      const musicPath = await Music.selectTrack(config.music_mood, config.music_dir);
      if (musicPath) {
        backgroundMusicPath = musicPath;
        console.log(`   ✅ Selected: ${path.basename(musicPath)}`);
      } else {
        console.log(`   ⚠️  No music found for mood "${config.music_mood}"`);
      }
    } catch (error) {
      console.log(`   ⚠️  Music selection failed: ${error}`);
    }
  } else {
    console.log('   ⏭️  Skipped (disabled in config)');
  }

  // Step 6: Build InputProps for Remotion
  console.log('\n🎬 Step 6: Building Remotion input props...');

  // Transform absolute asset paths → staticFile-compatible relative paths
  // Assets are symlinked at public/project-assets → config.assets_dir
  const assetsBase = config.assets_dir;
  const toStaticPath = (absPath: string | null | undefined): string | null => {
    if (!absPath) return null;
    if (absPath.startsWith(assetsBase)) {
      const rel = path.relative(assetsBase, absPath);
      return `project-assets/${rel}`;
    }
    // For files outside assets dir (e.g. logo), copy to public/
    return absPath;
  };

  // Handle logo: copy to public/ if it exists
  let logoStaticPath: string | null = null;
  if (config.logo_path) {
    try {
      const logoDest = path.join(publicDir, 'logo.png');
      await fs.copyFile(config.logo_path, logoDest);
      logoStaticPath = 'logo.png';
    } catch {
      console.log('   ⚠️  Could not copy logo to public/');
    }
  }

  // Handle background music: copy or symlink to public/
  let musicStaticPath: string | null = null;
  if (backgroundMusicPath) {
    try {
      const musicFilename = path.basename(backgroundMusicPath);
      const musicDest = path.join(publicDir, musicFilename);
      await fs.copyFile(backgroundMusicPath, musicDest);
      musicStaticPath = musicFilename;
    } catch {
      console.log('   ⚠️  Could not copy music to public/');
    }
  }

  // Transform scene asset paths
  const remotionScenes: Scene[] = scenes.map((scene) => ({
    ...scene,
    audio: {
      ...scene.audio,
      file_path: toStaticPath(scene.audio.file_path) || scene.audio.file_path,
    },
    video: {
      ...scene.video,
      file_path: toStaticPath(scene.video.file_path) || scene.video.file_path,
    },
    output_path: scene.output_path,
  }));

  const inputProps: BubbleVideoInputProps = {
    scenes: remotionScenes,
    logo_path: logoStaticPath,
    intro_video_path: config.intro_video_path ? toStaticPath(config.intro_video_path) : null,
    outro_video_path: config.outro_video_path ? toStaticPath(config.outro_video_path) : null,
    background_music_path: musicStaticPath,
    music_volume: config.audio.background_music_volume,
    config,
  };

  // Save sanitized props for Remotion Studio preview
  const sanitizedProps = {
    ...inputProps,
    config: {
      ...inputProps.config,
      pexels_api_key: '',
      openrouter_api_key: '',
      elevenlabs_api_key: undefined,
      heygen_api_key: undefined,
    },
  };
  const propsJsonPath = path.join(publicDir, 'props.json');
  await fs.writeFile(propsJsonPath, JSON.stringify(sanitizedProps, null, 2), 'utf-8');
  console.log('   ✅ Saved preview props to public/props.json');

  const totalDuration = scenes.reduce((sum, scene) => sum + scene.audio.duration, 0);
  console.log(`   Total content duration: ${totalDuration.toFixed(1)}s`);
  console.log(`   Number of scenes: ${scenes.length}`);

  // Step 7: Render video with Remotion
  console.log('\n🎥 Step 7: Rendering final video...');
  const finalVideoPath = await renderVideo(inputProps, config.final_video_path);

  // Step 8: Summary
  const endTime = Date.now();
  const elapsedSeconds = (endTime - startTime) / 1000;

  console.log('\n' + '═'.repeat(60));
  console.log('✅ VIDEO GENERATION COMPLETE!');
  console.log('═'.repeat(60));
  console.log(`📹 Output: ${finalVideoPath}`);
  console.log(`⏱️  Total time: ${formatDuration(elapsedSeconds)}`);
  console.log(`📊 Stats:`);
  console.log(`   - Scenes: ${scenes.length}`);
  console.log(`   - Duration: ${totalDuration.toFixed(1)}s`);
  console.log(`   - Script lines: ${scriptLines.length}`);
  console.log('═'.repeat(60) + '\n');

  return finalVideoPath;
}

/**
 * Process a single script line to create a Scene
 * Handles different scene types: title, avatar, broll
 */
async function processScriptLine(
  line: ScriptLine,
  index: number,
  config: ProjectConfig
): Promise<Scene> {
  const outputPath = path.join(config.assets_dir, `scene_${index}.mp4`);

  // Handle title cards (no audio, no video assets needed)
  if (line.type === 'title' || line.scene_type === 'title') {
    console.log('      Type: Title card');
    return {
      script_line: line,
      audio: {
        file_path: '',
        duration: config.timing.title_card_duration[0], // Use default duration
        subtitle_path: null,
        word_timings: null,
      },
      video: {
        file_path: '',
        width: 1920,
        height: 1080,
        duration: config.timing.title_card_duration[0],
      },
      output_path: outputPath,
    };
  }

  // Handle avatar scenes
  if (line.scene_type === 'avatar') {
    console.log('      Type: Avatar (HeyGen)');

    if (!config.heygen_api_key) {
      console.log('      ⚠️  No HeyGen API key, falling back to B-roll');
      // Fall through to broll processing
    } else {
      try {
        const videoPath = path.join(config.assets_dir, 'video', `avatar_${index}.mp4`);
        const videoAsset = await HeyGen.generateAvatar(
          line.text,
          videoPath,
          config.heygen_api_key,
          config.heygen_default_avatar_id,
          config.heygen_default_voice_id
        );

        console.log(`      ✅ Avatar generated: ${videoAsset.duration?.toFixed(1)}s`);

        // Avatar includes audio, so create a dummy audio asset
        return {
          script_line: line,
          audio: {
            file_path: videoPath, // Audio is embedded in video
            duration: videoAsset.duration || 5.0,
            subtitle_path: null,
            word_timings: null,
          },
          video: videoAsset,
          output_path: outputPath,
        };
      } catch (error) {
        console.log(`      ❌ Avatar generation failed: ${error}`);
        console.log('      Falling back to B-roll');
        // Fall through to broll processing
      }
    }
  }

  // Handle standard speech scenes (broll)
  console.log('      Type: B-roll + TTS');
  const audioPath = path.join(config.assets_dir, 'audio', `audio_${index}.mp3`);
  const videoPath = path.join(config.assets_dir, 'video', `video_${index}.mp4`);

  // Generate audio and video in parallel
  console.log('      🔄 Generating audio + video in parallel...');
  const [audioAsset, videoAsset] = await Promise.all([
    generateAudio(line, audioPath, config),
    generateVideoAsset(line, videoPath, config, index),
  ]);

  console.log(`      ✅ Audio: ${audioAsset.duration.toFixed(1)}s`);
  console.log(`      ✅ Video: ${videoAsset.width}x${videoAsset.height}`);

  return {
    script_line: line,
    audio: audioAsset,
    video: videoAsset,
    output_path: outputPath,
  };
}

/**
 * Generate audio using the configured TTS provider
 */
async function generateAudio(
  line: ScriptLine,
  outputPath: string,
  config: ProjectConfig
): Promise<AudioAsset> {
  const provider = config.tts_provider;

  switch (provider) {
    case 'elevenlabs':
      if (!config.elevenlabs_api_key) {
        throw new Error('ElevenLabs API key not configured');
      }
      return await ElevenLabs.generateSpeech(
        line.text,
        outputPath,
        config.elevenlabs_api_key,
        config.elevenlabs_voice_id
      );

    case 'edge':
      return await EdgeTTS.generateSpeech(line.text, outputPath);

    case 'openai':
    default:
      return await OpenAITTS.generateSpeech(
        line.text,
        outputPath,
        config.openrouter_api_key,
        config.audio.tts_voice
      );
  }
}

/**
 * Generate/download video using Pexels or custom media
 */
async function generateVideoAsset(
  line: ScriptLine,
  outputPath: string,
  config: ProjectConfig,
  index: number
): Promise<VideoAsset> {
  // Use custom media if provided
  if (line.custom_media_path && (await fileExists(line.custom_media_path))) {
    console.log(`      📎 Using custom media: ${path.basename(line.custom_media_path)}`);

    try {
      const dimensions = await getVideoDimensions(line.custom_media_path);
      const duration = await getVideoDuration(line.custom_media_path);

      return {
        file_path: line.custom_media_path,
        width: dimensions.width,
        height: dimensions.height,
        duration,
      };
    } catch (error) {
      // If it's an image, dimensions will fail - that's ok
      return {
        file_path: line.custom_media_path,
        width: 1920,
        height: 1080,
        duration: undefined, // Image - duration determined by audio
      };
    }
  }

  // Download from Pexels
  const query = line.search_query || 'technology abstract';
  const result = await Pexels.searchAndDownload(query, outputPath, config.pexels_api_key);
  if (result) return result;

  // No video found — return a placeholder (scene will render as title card style)
  return { file_path: '', width: 1920, height: 1080, duration: undefined };
}

/**
 * Parse raw script.json data into ScriptLine[]
 */
function parseScriptJson(rawData: unknown): ScriptLine[] {
  if (!Array.isArray(rawData)) {
    throw new Error('script.json must be an array');
  }

  return rawData.map((item: any, index: number) => {
    if (!item.text) {
      throw new Error(`Script line ${index} missing required field: text`);
    }

    // Determine line type and scene type
    const lineType = item.type === 'title' ? 'title' : 'speech';
    const sceneType =
      item.type === 'title' ? 'title' : item.scene_type || 'broll';

    return {
      text: item.text,
      type: lineType,
      scene_type: sceneType,
      search_query: item.search_query,
      highlight_word: item.highlight_word ?? null,
      custom_media_path: item.custom_media_path ?? null,
      voice_id: item.voice_id ?? null,
    };
  });
}

/**
 * Helper: Check if file exists
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Helper: Ensure directory exists
 */
async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    // Ignore if already exists
  }
}

/**
 * Helper: Format duration for display
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}
