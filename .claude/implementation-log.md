# Implementation Log
**Stack**: Python (Clean Architecture) + FFmpeg | **Updated**: 2026-01-26

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

## Recent Changes
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
