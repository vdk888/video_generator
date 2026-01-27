# Services - TypeScript API Adapters

This directory contains TypeScript implementations of all external API adapters, ported from the Python `src/adapters/` directory.

## Overview

Each service module provides async functions for interacting with external APIs. All services use:
- Native `fetch()` for HTTP requests
- `fs/promises` for file I/O
- `child_process.spawn()` for FFmpeg/FFprobe operations
- TypeScript types from `src/types.ts`

## Services

### 1. OpenRouter (`openrouter.ts`)
**Purpose**: Script generation using LLM (OpenAI GPT models via OpenRouter)

**Function**:
```typescript
generateScript(rawText: string, config: ProjectConfig): Promise<ScriptLine[]>
```

**Details**:
- Converts raw text into structured video script with segmentation, visual queries, and highlights
- Uses system prompt from VIDEO_BIBLE.md (Bubble storytelling tone)
- Returns array of `ScriptLine` objects with type, text, search_query, highlight_word, scene_type

**Example**:
```typescript
import { OpenRouter } from './services/index.js';
import { loadConfig } from './config.js';

const config = loadConfig('my-project');
const script = await OpenRouter.generateScript(rawText, config);
```

---

### 2. OpenAI TTS (`openai-tts.ts`)
**Purpose**: High-quality text-to-speech via OpenRouter's audio API

**Function**:
```typescript
generateSpeech(
  text: string,
  outputPath: string,
  apiKey: string,
  voice?: string
): Promise<AudioAsset>
```

**Details**:
- Streams PCM16 audio from OpenAI TTS API
- Converts to MP3 (48kHz stereo) via FFmpeg
- Generates ASS subtitle file with ~40 char chunks
- Returns `AudioAsset` with duration and subtitle path

**Audio Flow**:
1. Stream base64-encoded PCM16 chunks from API
2. Save raw PCM to temp file
3. Convert to MP3 using FFmpeg (`-ar 48000 -ac 2`)
4. Generate subtitles with proportional timing
5. Return AudioAsset

**Subtitle Format**: ASS with Inter font, white text, brand color highlights

---

### 3. ElevenLabs (`elevenlabs.ts`)
**Purpose**: Premium multilingual TTS with natural voices

**Function**:
```typescript
generateSpeech(
  text: string,
  outputPath: string,
  apiKey: string,
  voiceId?: string
): Promise<AudioAsset>
```

**Details**:
- Direct MP3 streaming from ElevenLabs API
- No conversion needed (already MP3 format)
- Default voice: Bella (French female) - `EXAVITQu4vr4xnSDxMaL`
- Same subtitle generation as OpenAI TTS

**Voice Settings**:
- Model: `eleven_multilingual_v2`
- Stability: 0.5
- Similarity boost: 0.75

---

### 4. Edge TTS (`edge-tts.ts`)
**Purpose**: Free TTS using Microsoft Edge browser engine

**Function**:
```typescript
generateSpeech(
  text: string,
  outputPath: string,
  voice?: string
): Promise<AudioAsset>
```

**Details**:
- Requires `edge-tts` CLI tool (Python package or npm equivalent)
- Generates MP3 + VTT subtitles natively
- Converts VTT to ASS with brand styling
- Default voice: `fr-FR-VivienneMultilingualNeural`

**Prerequisites**:
```bash
# Python version (recommended)
pip install edge-tts

# Or npm version
npm install -g edge-tts
```

**Note**: Edge TTS provides word-level timestamps in VTT format, which could be parsed for precise timing.

---

### 5. HeyGen (`heygen.ts`)
**Purpose**: AI avatar talking head video generation

**Function**:
```typescript
generateAvatar(
  text: string,
  outputPath: string,
  apiKey: string,
  avatarId?: string,
  voiceId?: string
): Promise<VideoAsset>
```

**Details**:
- Async video generation with polling (5s intervals, 10min timeout)
- Downloads completed video from HeyGen CDN
- Normalizes to 1920x1080@25fps yuv420p (CRITICAL for pipeline compatibility)
- Returns `VideoAsset` with duration

**API Flow**:
1. POST to `/v2/video/generate` → get `video_id`
2. Poll `/v1/video_status.get` every 5s until status = "completed"
3. Download video from returned `video_url`
4. Normalize via FFmpeg (scale, pad, re-encode to yuv420p)

**Default Avatar**: `Angela-inblackskirt-20220820` (professional female presenter)
**Default Voice**: `1bd001e7e50f421d891986aad5158bc8` (French female)

---

### 6. Pexels (`pexels.ts`)
**Purpose**: Stock B-roll video search and download

**Function**:
```typescript
searchAndDownload(
  query: string,
  outputPath: string,
  apiKey: string,
  minDuration?: number
): Promise<VideoAsset>
```

**Details**:
- Searches for landscape HD videos (1920x1080 or higher)
- Prioritizes `size=large` for best quality
- Caches downloads (skips if file exists)
- Fallback to "abstract digital background" if query fails

**Search Strategy** (from VIDEO_BIBLE.md):
- Use **feeling-based** queries, not literal terms
- ❌ "stock market" → ✅ "timelapse busy city lights at night"
- ❌ "AI" → ✅ "neural network visualization glowing"
- ❌ "growth" → ✅ "sunrise over mountain peak timelapse"

**Example**:
```typescript
import { Pexels } from './services/index.js';

const video = await Pexels.searchAndDownload(
  'futuristic cyborg face close up cinematic lighting',
  'assets/video_001.mp4',
  config.pexels_api_key
);
```

---

### 7. Music (`music.ts`)
**Purpose**: Local music track selection from organized library

**Functions**:
```typescript
selectTrack(mood: string, assetsDir?: string): Promise<string | null>
listAvailableMoods(assetsDir?: string): Promise<string[]>
getTracksForMood(mood: string, assetsDir?: string): Promise<string[]>
```

**Details**:
- File-based music library (no API calls)
- Organized by mood: `assets/music/{mood}/{track}.mp3`
- Supports: `.mp3`, `.wav`, `.m4a`, `.aac`, `.ogg`

**Directory Structure**:
```
assets/music/
├── ambient_cinematic/
│   ├── track1.mp3
│   └── track2.mp3
├── upbeat/
│   └── track1.mp3
└── dramatic/
    └── track1.mp3
```

**Usage**:
```typescript
import { Music } from './services/index.js';

const trackPath = await Music.selectTrack('ambient_cinematic', 'assets');
if (trackPath) {
  console.log(`Selected: ${trackPath}`);
}
```

---

## Common Patterns

### Error Handling
All services throw errors on failure. Wrap calls in try/catch:

```typescript
try {
  const audio = await OpenAITTS.generateSpeech(text, outputPath, apiKey);
} catch (error) {
  console.error('TTS failed:', error);
  // Handle fallback or retry
}
```

### FFmpeg Dependencies
Services use FFmpeg and FFprobe for:
- Audio format conversion (PCM → MP3)
- Video normalization (any format → yuv420p)
- Duration detection (ffprobe)

**Ensure FFmpeg is in PATH**:
```bash
ffmpeg -version
ffprobe -version
```

### Async/Await
All functions are async. Use in async contexts:

```typescript
async function generateVideo() {
  const script = await OpenRouter.generateScript(rawText, config);

  for (const line of script) {
    if (line.type === 'speech') {
      const audio = await OpenAITTS.generateSpeech(
        line.text,
        `assets/audio_${i}.mp3`,
        config.openrouter_api_key
      );
    }
  }
}
```

### Type Safety
All services use types from `src/types.ts`:
- `ScriptLine`: Script line with metadata
- `AudioAsset`: Audio file with duration and subtitles
- `VideoAsset`: Video file with dimensions and duration
- `ProjectConfig`: Environment configuration

---

## Configuration

Services expect configuration from `src/config.ts`:

```typescript
import { loadConfig } from './config.js';

const config = loadConfig('my-project');

// config contains:
// - openrouter_api_key
// - pexels_api_key
// - elevenlabs_api_key (optional)
// - heygen_api_key (optional)
// - tts_provider ('openai' | 'elevenlabs' | 'edge')
// - assets_dir, music_dir, etc.
```

**Required Environment Variables** (`.env`):
```env
OPENROUTER_API_KEY=sk-or-v1-...
PEXELS_API_KEY=...

# Optional
ELEVENLABS_API_KEY=...
HEYGEN_API_KEY=...
TTS_PROVIDER=openai
```

---

## Testing

### Unit Tests (TODO)
Each service should have unit tests covering:
- Happy path (successful API calls)
- Error handling (network errors, invalid responses)
- Edge cases (empty text, missing files)

### Integration Tests
Test with real API keys (use test accounts):

```typescript
// test/services/openai-tts.test.ts
import { generateSpeech } from '../src/services/openai-tts.js';
import { loadConfig } from '../src/config.js';

const config = loadConfig('test');

test('generates audio and subtitles', async () => {
  const audio = await generateSpeech(
    'Hello world',
    '/tmp/test_audio.mp3',
    config.openrouter_api_key
  );

  expect(audio.duration).toBeGreaterThan(0);
  expect(audio.subtitle_path).toContain('.ass');
});
```

---

## Migration from Python

### Differences from Python Adapters

| Feature | Python | TypeScript |
|---------|--------|------------|
| HTTP Client | `aiohttp` | Native `fetch()` |
| File I/O | `open()`, `pathlib` | `fs/promises` |
| Subprocess | `subprocess.run()` | `child_process.spawn()` |
| Async | `async def` | `async function` |
| Type Hints | `-> AudioAsset` | `: Promise<AudioAsset>` |

### Port Checklist

✅ **OpenRouter**: Script generation with VIDEO_BIBLE prompt
✅ **OpenAI TTS**: PCM16 streaming + FFmpeg conversion
✅ **ElevenLabs**: Direct MP3 streaming
✅ **Edge TTS**: CLI wrapper + VTT conversion
✅ **HeyGen**: Polling flow + video normalization
✅ **Pexels**: Search + download with fallback
✅ **Music**: File-based selection

### Behavior Parity

All TypeScript services match Python adapter behavior:
- Same API endpoints and request formats
- Same polling logic (HeyGen: 5s, 10min timeout)
- Same FFmpeg normalization flags (`-pix_fmt yuv420p`)
- Same subtitle format (ASS with brand colors)
- Same error handling and fallbacks

---

## Next Steps

### Phase 3: Video Rendering (FFmpeg Adapter)
Port `src/adapters/ffmpeg_adapter.py` to TypeScript or use Node.js wrapper.

**Key operations**:
- `render_scene()`: Combine audio + video + subtitles
- `concat_scenes()`: Merge scenes with xfade transitions
- `render_title_card()`: Generate title cards
- `render_kinetic_typography()`: Text overlays with dimmed background

### Phase 4: Use Cases / Orchestration
Port `src/app/use_cases.py` to TypeScript:
- Scene generation loop
- TTS provider routing
- Avatar vs B-roll scene routing
- Background music integration

### Phase 5: Remotion Integration
Use these services in Remotion compositions:
- Pre-generate assets (audio, video, subtitles)
- Pass `BubbleVideoInputProps` to Remotion
- Render final video via `npx remotion render`

---

## Troubleshooting

### FFmpeg Not Found
```
Error: spawn ffmpeg ENOENT
```
**Solution**: Install FFmpeg and add to PATH:
```bash
# macOS
brew install ffmpeg

# Ubuntu
sudo apt install ffmpeg
```

### Edge TTS CLI Not Found
```
Error: spawn edge-tts ENOENT
```
**Solution**: Install edge-tts:
```bash
pip install edge-tts
# Or
npm install -g edge-tts
```

### API Key Errors
```
Error: OpenRouter API error (401): Unauthorized
```
**Solution**: Check `.env` file has valid keys:
```bash
cat .env | grep API_KEY
```

### HeyGen Timeout
```
Error: HeyGen video generation timed out after 600s
```
**Solution**:
- Check HeyGen account quota
- Try shorter text (HeyGen takes longer for long scripts)
- Increase timeout in `pollVideoStatus()` call

---

## License

MIT License - See LICENSE file in project root.

## Contributing

When adding new services:
1. Follow existing patterns (async functions, TypeScript types)
2. Use native Node.js APIs (fetch, fs/promises, child_process)
3. Add JSDoc comments for public functions
4. Export via `index.ts`
5. Update this README with usage examples
