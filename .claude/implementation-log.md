# Implementation Log
**Stack**: TypeScript + Remotion (migrating from Python) | **Updated**: 2026-01-27 (Phase 5)

## Project Patterns
- **Backend structure**: Clean Architecture with ports/adapters pattern in `src/`
- **Core logic**: `src/app/use_cases.py` orchestrates the video generation flow
- **Interfaces**: Defined in `src/ports/interfaces.py` (Protocol classes)
- **Adapters**: In `src/adapters/` - FFmpegAdapter, OpenAI/ElevenLabs/Edge TTS, Pexels, OpenRouter, HeyGen
- **Domain models**: Dataclasses in `src/domain/models.py`
- **Assets**: Generated in `assets/` directory (audio, video, scenes)
- **Import style**: Absolute imports from `src...`

## What Works
- **FFmpeg rendering**: Use `-pix_fmt yuv420p` for compatibility (CRITICAL)
- **Audio format**: 48kHz, stereo, AAC is standard
- **Async pattern**: TTS providers use async/await for IO-bound tasks
- **Static images**: FFmpegAdapter uses `-loop 1` for images vs `-stream_loop -1` for videos
- **Kinetic typography**: Implemented via drawtext filter with brightness dimming (-0.4)
- **Video concat**: Re-encode during concat to avoid timebase/SAR mismatches
- **Transitions**: xfade filter with 0.4s fade + acrossfade for audio (default from VIDEO_BIBLE.md)
- **Background music**: amix filter with aloop for looping, afade for in/out, volume=-20dB for ducking
- **TTS providers**: All implement TTSProvider protocol (async generate_audio), return AudioAsset with MP3 + ASS
- **ElevenLabs API**: Use aiohttp for async streaming, write MP3 chunks directly to file
- **HeyGen avatar flow**: Submit → poll (5s, 10min timeout) → download → normalize to yuv420p
- **Scene routing**: scene_type field routes to broll/avatar/title processing paths

## Gotchas
- **FFmpeg escaping**: Write text to temp files instead of passing strings directly
- **Script generation**: OpenRouter is skipped if `script.json` exists (Director Mode)
- **Custom media**: Check file exists before using, fallback to Pexels search
- **Font paths**: Inter-ExtraBold in `assets/fonts/extras/ttf/`, fallback to system fonts
- **Audio mixing**: Need to enforce standard format (AAC 48k) for concat compatibility
- **Transition offsets**: For N clips with xfade, offset_i = sum(durations[:i]) - (i * transition_duration)
- **Scene duration probe**: Use ffprobe to get durations, fallback to simple concat if probe fails
- **Music mixing workflow**: Concat first, then add music in second pass (temp file pattern)
- **Music looping**: Use `-stream_loop -1` for input + aloop filter + atrim to exact duration
- **Remotion imports**: Use extension-less imports (`./Component` not `./Component.js`) for webpack compatibility
- **Node polyfills**: Webpack 5+ requires explicit polyfills (path-browserify, url, os-browserify, crypto-browserify)
- **Font loading**: Use @remotion/google-fonts for Inter font, fallback to CSS @import for browser compatibility
- **Brand constants**: ALL styling values must come from src/brand.ts (no hardcoded colors/sizes)

## Migration Progress
- **Phase 1**: TypeScript scaffolding (types, config, Root.tsx) - COMPLETE
- **Phase 2**: Service adapters (OpenRouter, TTS, HeyGen, Pexels, Music) - COMPLETE
- **Phase 3**: Remotion compositions (BubbleVideo, SceneRouter, etc.) - COMPLETE
- **Phase 4**: Orchestrator + main entry point - COMPLETE (2026-01-27)
- **Phase 5**: Brand compliance audit + font loading - COMPLETE (2026-01-27)

## Phase 4 TypeScript Files
- **src/orchestrator.ts**: Main pipeline orchestrator (port of use_cases.py)
  - `generateVideo(projectName)` - main entry point
  - Handles: script loading/generation, asset processing, parallel TTS+video, music selection, Remotion rendering
  - Scene routing: title (no assets), avatar (HeyGen), broll (TTS+Pexels)
  - Director Mode: uses script.json if exists, else generates from raw_source.txt
- **src/render.ts**: Remotion rendering wrapper
  - `renderVideo(inputProps, outputPath)` - bundles + renders composition
  - H.264/AAC output, yuv420p pixel format, progress tracking
- **src/main.ts**: CLI entry point (port of main.py)
  - Arg parsing (--project=NAME), error handling, usage help
- **src/utils/audio.ts**: Audio utilities (ffprobe wrappers)
  - `getAudioDuration(filePath)` - returns seconds
- **src/utils/video.ts**: Video utilities (ffprobe wrappers)
  - `getVideoDuration(filePath)`, `getVideoDimensions(filePath)`, `getVideoFrameRate(filePath)`

## Recent Changes
- [2026-01-27]: TypeScript Phase 5 - Brand Compliance Audit & Font Loading
  - Created: src/brand.ts (single source of truth for ALL brand styling constants)
  - Modified: All composition files to use brand constants (no hardcoded values)
  - Fixed: Subtitle highlight color to #667eea (violet) - was incorrectly #ea7e66 (orange) in Python version
  - Implemented: Inter font loading via @remotion/google-fonts with fallback CSS @import
  - Modified: Root.tsx to load Inter font (weights: 400, 600, 700, 800)
  - Updated: All typography to use brand constants (KINETIC: 170px, TITLE_CARD: 90px, SUBTITLE: 60px)
  - Updated: All colors from brand constants (PRIMARY_TEXT #000000, BACKGROUND #FFFFFF, ACCENT_VIOLET #667eea)
  - Updated: All timing constants (TRANSITION_DURATION: 0.4s, MUSIC_FADE_DURATION: 2s)
  - Fixed: Remotion webpack config - added Node polyfills (path-browserify, url, os-browserify, crypto-browserify)
  - Fixed: Import syntax - removed .js extensions for webpack compatibility
  - Verified: Video scaling (width: 100%, height: 100%, objectFit: 'cover') in all video components
  - Brand compliance: 100% - all compositions now follow Charte Graphique exactly
- [2026-01-27]: TypeScript Phase 4 - Orchestrator & Main Entry Point
  - Created: src/orchestrator.ts (main pipeline - generateVideo function)
  - Created: src/render.ts (Remotion bundling + rendering wrapper)
  - Modified: src/main.ts (CLI entry point with arg parsing and error handling)
  - Created: src/utils/audio.ts (getAudioDuration via ffprobe)
  - Created: src/utils/video.ts (getVideoDuration, getVideoDimensions, getVideoFrameRate)
  - Pipeline flow: Config → Script (load/generate) → Process scenes (parallel TTS+video) → Music → Render
  - TTS provider selection: openai/elevenlabs/edge based on config
  - Scene processing: title (no assets), avatar (HeyGen video), broll (TTS audio + Pexels video)
  - Parallel asset generation: Promise.all for TTS + Pexels per scene
  - Type safety: All functions typed, no 'any' types
  - Error handling: Try/catch with fallbacks, helpful error messages
- [2026-01-26]: Implemented HeyGen Avatar Adapter - AI talking head videos (Sprint 3-4)
  - Files: src/ports/interfaces.py (AvatarProvider protocol)
  - Created: src/adapters/heygen_adapter.py (async generation, polling, download, normalization)
  - Modified: src/domain/models.py (scene_type field in ScriptLine, HeyGen config in ProjectConfig)
  - Modified: src/infra/config.py (HEYGEN_API_KEY, default avatar/voice IDs)
  - Modified: src/app/use_cases.py (scene_type routing: broll/avatar/title)
  - Modified: main.py (HeyGen adapter wiring with optional initialization)
  - Created: test_avatar.py, HEYGEN_INTEGRATION.md
  - Async flow: submit request → poll status (5s intervals, 10min timeout) → download → normalize (1920x1080@25fps yuv420p)
  - Scene routing allows mixing avatar scenes with broll and title cards in same video
  - Fallback to broll if avatar provider not configured (graceful degradation)
- [2026-01-26]: Implemented ElevenLabs TTS Adapter (Sprint 3)
  - Files: src/adapters/elevenlabs_adapter.py (new), main.py (provider selection)
  - Modified: .env (TTS_PROVIDER, ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID)
  - Created: test_elevenlabs.py, docs/ELEVENLABS_SETUP.md
  - TTS provider selection via TTS_PROVIDER env var (openai/elevenlabs/edge)
  - ElevenLabs API: POST to /v1/text-to-speech/{voice_id}, streams MP3 directly
  - Same interface as OpenAI TTS: async generate_audio, MP3 + ASS output
  - Subtitle generation: 40-char chunks, proportional duration, brand color highlights
  - Default voice: Bella (EXAVITQu4vr4xnSDxMaL) - French female
- [2026-01-26]: Implemented Music Service - background music layer (IUET 4.15)
  - Files: src/ports/interfaces.py (IMusicService), src/adapters/music_adapter.py (new)
  - Modified: src/adapters/ffmpeg_adapter.py (_add_background_music method)
  - Modified: src/app/use_cases.py (music integration), src/infra/config.py (music settings)
  - Modified: src/domain/models.py (music config fields)
  - Created: assets/music/README.md, tests/test_music_adapter.py
  - Music mixed at -20dB with 0.5s fade in/out, auto-looped to video duration
  - File-based music library organized by mood (ambient_cinematic, upbeat, dramatic)
- [2026-01-26]: Implemented Transition System with FFmpeg xfade (IUET 4.40)
  - Files: src/adapters/ffmpeg_adapter.py, src/ports/interfaces.py, src/app/use_cases.py
  - Added transition_duration parameter to concat_scenes (default 0.4s from VIDEO_BIBLE.md)
  - Implemented xfade for video and acrossfade for audio
  - Added fallback to simple concat if xfade fails or scenes too short
