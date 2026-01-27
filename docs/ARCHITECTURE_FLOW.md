# Architecture Flow: Bubble Video Engine (TypeScript + Remotion)

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                   src/main.ts                                   │
│                           (Entry Point / CLI Parser)                            │
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                         src/orchestrator.ts                               │  │
│  │                     (Pipeline Orchestration Logic)                        │  │
│  │                                                                           │  │
│  │  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   │  │
│  │  │   Services  │   │   Services  │   │   Services  │   │  Remotion   │   │  │
│  │  │    (TTS)    │   │   (Media)   │   │  (Avatar)   │   │  (Render)   │   │  │
│  │  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘   │  │
│  └─────────┼─────────────────┼─────────────────┼─────────────────┼──────────┘  │
└────────────┼─────────────────┼─────────────────┼─────────────────┼──────────────┘
             │                 │                 │                 │
    ┌────────┴────────┐  ┌─────┴─────┐    ┌──────┴──────┐   ┌──────┴──────┐
    │    SERVICES     │  │  SERVICES │    │   SERVICES  │   │ COMPOSITIONS│
    ├─────────────────┤  ├───────────┤    ├─────────────┤   ├─────────────┤
    │ openai-tts.ts   │  │pexels.ts  │    │heygen.ts    │   │BubbleVideo  │
    │ elevenlabs.ts   │  │music.ts   │    │             │   │SceneComp.   │
    │ edge-tts.ts     │  └───────────┘    └─────────────┘   │TitleCard    │
    └─────────────────┘                                      └─────────────┘
```

---

## Complete Pipeline Flow

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                           INPUT: raw_source.txt                                  │
│                                     │                                            │
│                                     ▼                                            │
│              ┌────────────────────────────────────────────┐                      │
│              │    OpenRouter Service (LLM)                │                      │
│              │    src/services/openrouter.ts              │                      │
│              │  • Segmentation (rhythm chunks)            │                      │
│              │  • Search queries (feeling, not literal)   │                      │
│              │  • Highlight words (kinetic triggers)      │                      │
│              │  • Scene type assignment                   │                      │
│              └────────────────────────────────────────────┘                      │
│                                     │                                            │
│                                     ▼                                            │
│                            script.json created                                   │
│            (Skip LLM if script.json exists = Director Mode)                      │
└──────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│              STAGE 1: PROCESS EACH SCRIPT LINE (Loop)                            │
│                                                                                  │
│    ┌─────────────────────────────────────────────────────────────────────────┐   │
│    │  FOR each line IN script.json:                                          │   │
│    │                                                                         │   │
│    │    ┌───────────────── scene_type Router ─────────────────┐              │   │
│    │    │                                                     │              │   │
│    │    ▼                          ▼                          ▼              │   │
│    │                                                                         │   │
│    │  ┌──────────┐           ┌──────────┐            ┌────────────┐          │   │
│    │  │  TITLE   │           │  AVATAR  │            │   B-ROLL   │          │   │
│    │  │ (static) │           │ (HeyGen) │            │ (default)  │          │   │
│    │  └────┬─────┘           └────┬─────┘            └─────┬──────┘          │   │
│    │       │                      │                        │                 │   │
│    │       ▼                      ▼                        ▼                 │   │
│    │  ┌──────────┐         ┌────────────┐          ┌─────────────────┐       │   │
│    │  │Remotion  │         │HeyGen Svc  │          │  PARALLEL FLOW  │       │   │
│    │  │TitleCard │         │  (async)   │          │                 │       │   │
│    │  │component │         │•API call   │          │ ┌─────┬───────┐ │       │   │
│    │  │(renders  │         │•Poll status│          │ │     │       │ │       │   │
│    │  │ later)   │         │•Download   │          │ ▼     ▼       ▼ │       │   │
│    │  └────┬─────┘         │•Normalize  │          │TTS  Media  Render│      │   │
│    │       │               └─────┬──────┘          │  Service       │       │   │
│    │       │                     │                 └─────────────────┘       │   │
│    │       │                     │                        │                 │   │
│    │       ▼                     ▼                        ▼                 │   │
│    │    Scene object        Scene object             Scene object           │   │
│    │  (metadata only)      (video+audio)          (audio+video assets)      │   │
│    │                                                                         │   │
│    └─────────────────────────────────────────────────────────────────────────┘   │
│                                     │                                            │
│                                     ▼                                            │
│                        scenes[] = [scene_0, scene_1, ...]                        │
└──────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                     STAGE 2: MUSIC SELECTION (Optional)                          │
│              ┌────────────────────────────────────────────┐                      │
│              │         Music Service                      │                      │
│              │         src/services/music.ts              │                      │
│              │  • Mood: ambient_cinematic, upbeat, etc.   │                      │
│              │  • From: assets/music/{mood}/              │                      │
│              └────────────────────────────────────────────┘                      │
│                                     │                                            │
│                                     ▼                                            │
│                              music_path.mp3                                      │
└──────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                 STAGE 3: BUILD REMOTION INPUT PROPS                              │
│              ┌────────────────────────────────────────────┐                      │
│              │        src/orchestrator.ts                 │                      │
│              │  Build BubbleVideoInputProps:              │                      │
│              │  • scenes[] array                          │                      │
│              │  • logo_path, intro/outro paths            │                      │
│              │  • background_music_path                   │                      │
│              │  • config (timing, transitions, etc.)      │                      │
│              └────────────────────────────────────────────┘                      │
│                                     │                                            │
│                                     ▼                                            │
│                            inputProps object                                     │
└──────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                 STAGE 4: RENDER WITH REMOTION                                    │
│              ┌────────────────────────────────────────────┐                      │
│              │         src/render.ts                      │                      │
│              │  @remotion/renderer bundle()               │                      │
│              │                                            │                      │
│              │  REMOTION COMPOSITION FLOW:                │                      │
│              │  ┌──────────────────────────────────────┐  │                      │
│              │  │  BubbleVideo.tsx (main)              │  │                      │
│              │  │  • Calculates total duration         │  │                      │
│              │  │  • Renders intro (if present)        │  │                      │
│              │  │  • Maps scenes to <Sequence>s        │  │                      │
│              │  │  • Each scene → SceneComposition     │  │                      │
│              │  │  • Renders outro (if present)        │  │                      │
│              │  │  • Adds background music track       │  │                      │
│              │  └──────────────────────────────────────┘  │                      │
│              │                 │                          │                      │
│              │                 ▼                          │                      │
│              │  ┌──────────────────────────────────────┐  │                      │
│              │  │  SceneComposition.tsx (per scene)    │  │                      │
│              │  │  • Routes by scene_type:             │  │                      │
│              │  │    - title → TitleCard               │  │                      │
│              │  │    - avatar → Video (HeyGen)         │  │                      │
│              │  │    - broll → Video + Subtitles       │  │                      │
│              │  │  • Overlays highlight text if set    │  │                      │
│              │  │  • Syncs audio with video            │  │                      │
│              │  └──────────────────────────────────────┘  │                      │
│              │                 │                          │                      │
│              │                 ▼                          │                      │
│              │  OUTPUT FORMAT:                            │                      │
│              │  • 1920x1080 @ 25fps (configurable)        │                      │
│              │  • H.264 video / AAC audio                 │                      │
│              │  • Crossfade transitions (via Remotion)    │                      │
│              │  • Background music mixed at -20dB         │                      │
│              └────────────────────────────────────────────┘                      │
│                                     │                                            │
│                                     ▼                                            │
│                           final_output.mp4                                       │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## B-Roll Scene Detail Flow

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                     B-ROLL SCENE PROCESSING (Expanded)                           │
│                                                                                  │
│  ScriptLine: {                                                                   │
│    text: "L'IA va transformer notre monde.",                                     │
│    search_query: "futuristic city lights night cinematic",                       │
│    highlight_word: "transformer",                                                │
│    scene_type: "broll"                                                           │
│  }                                                                               │
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐    │
│  │                      PARALLEL PROCESSING                                 │    │
│  │                                                                          │    │
│  │  ┌─────────────────┐    ┌─────────────────┐                              │    │
│  │  │  1. TTS (async) │    │  2. MEDIA FETCH │                              │    │
│  │  │                 │    │                 │                              │    │
│  │  │  TTS Service    │    │  Pexels Service │                              │    │
│  │  │  (openai-tts,   │    │  src/services/  │                              │    │
│  │  │   elevenlabs,   │    │  pexels.ts      │                              │    │
│  │  │   or edge-tts)  │    │                 │                              │    │
│  │  │                 │    │  • Search API   │                              │    │
│  │  │  • Generate MP3 │    │  • Filter 16:9  │                              │    │
│  │  │  • Get duration │    │  • Download HD  │                              │    │
│  │  │        │        │    │        │        │                              │    │
│  │  │        ▼        │    │        ▼        │                              │    │
│  │  │  ┌──────────┐   │    │  ┌──────────┐   │                              │    │
│  │  │  │audio.mp3 │   │    │  │video.mp4 │   │                              │    │
│  │  │  │(duration)│   │    │  │(raw HD)  │   │                              │    │
│  │  │  └──────────┘   │    │  └──────────┘   │                              │    │
│  │  └────────┬────────┘    └────────┬────────┘                              │    │
│  │           │                      │                                       │    │
│  │           └──────────────────────┴───────────────────────┐               │    │
│  │                                  │                       │               │    │
│  │                                  ▼                       ▼               │    │
│  │                          AudioAsset              VideoAsset              │    │
│  │                     (file_path, duration)  (file_path, dimensions)       │    │
│  │                                  │                       │               │    │
│  │                                  └───────────┬───────────┘               │    │
│  │                                              ▼                           │    │
│  │                                        Scene object                      │    │
│  │                                   (ready for Remotion)                   │    │
│  └──────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  Later, during Remotion rendering:                                               │
│  ┌──────────────────────────────────────────────────────────────────────────┐    │
│  │  SceneComposition.tsx renders:                                           │    │
│  │  • <Video> with video.mp4 (looped to audio duration)                     │    │
│  │  • <Audio> with audio.mp3                                                │    │
│  │  • <Subtitles> (word-by-word if available)                               │    │
│  │  • <HighlightText> (if highlight_word present)                           │    │
│  └──────────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## Avatar (HeyGen) Flow

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                        AVATAR SCENE (HeyGen API)                                 │
│                                                                                  │
│  ScriptLine: {                                                                   │
│    text: "Bonjour, bienvenue dans cette vidéo.",                                 │
│    scene_type: "avatar"                                                          │
│  }                                                                               │
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐    │
│  │                    HeyGen Service (async)                                │    │
│  │                    src/services/heygen.ts                                │    │
│  │                                                                          │    │
│  │  STEP 1: Create Video Request                                            │    │
│  │  ┌────────────────────────────────────────────────────────────────────┐  │    │
│  │  │  POST /v2/video/generate                                           │  │    │
│  │  │  {                                                                 │  │    │
│  │  │    "video_inputs": [{                                              │  │    │
│  │  │      "character": { "type": "avatar", "avatar_id": "..." },        │  │    │
│  │  │      "voice": { "type": "text", "voice_id": "...", "input_text" }  │  │    │
│  │  │    }],                                                             │  │    │
│  │  │    "dimension": { "width": 1920, "height": 1080 }                  │  │    │
│  │  │  }                                                                 │  │    │
│  │  └────────────────────────────────────────────────────────────────────┘  │    │
│  │                              │                                           │    │
│  │                              ▼                                           │    │
│  │  STEP 2: Poll Status (every 5s, max 10min)                               │    │
│  │  ┌────────────────────────────────────────────────────────────────────┐  │    │
│  │  │  GET /v1/video_status.get?video_id={id}                            │  │    │
│  │  │                                                                    │  │    │
│  │  │  Status: pending → processing → completed                          │  │    │
│  │  │           └────────► poll again ◄────────┘                         │  │    │
│  │  └────────────────────────────────────────────────────────────────────┘  │    │
│  │                              │                                           │    │
│  │                              ▼                                           │    │
│  │  STEP 3: Download Video                                                  │    │
│  │  ┌────────────────────────────────────────────────────────────────────┐  │    │
│  │  │  GET video_url (from completed response)                           │  │    │
│  │  │  Stream download → avatar.mp4                                      │  │    │
│  │  │  (URL expires in 7 days - must download immediately)               │  │    │
│  │  └────────────────────────────────────────────────────────────────────┘  │    │
│  │                              │                                           │    │
│  │                              ▼                                           │    │
│  │  STEP 4: Get Video Metadata                                              │    │
│  │  ┌────────────────────────────────────────────────────────────────────┐  │    │
│  │  │  Use ffprobe to extract:                                           │  │    │
│  │  │  • Duration                                                        │  │    │
│  │  │  • Dimensions                                                      │  │    │
│  │  │  (HeyGen video already normalized to 1920x1080@25fps)              │  │    │
│  │  └────────────────────────────────────────────────────────────────────┘  │    │
│  │                              │                                           │    │
│  │                              ▼                                           │    │
│  │                        VideoAsset                                        │    │
│  │                  (avatar video with embedded voice)                      │    │
│  └──────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  NOTE: Avatar scenes include their own audio (HeyGen TTS)                        │
│        No external TTS or subtitle generation needed                             │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## Music Mixing Flow

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                   MUSIC MIXING (in Remotion Composition)                         │
│                                                                                  │
│  INPUTS:                                                                         │
│    scenes[] (each with voice audio)                                              │
│    background_music_path (from Music Service)                                    │
│                                                                                  │
│  REMOTION AUDIO MIXING:                                                          │
│                                                                                  │
│    ┌──────────────────────────────────────────────────────────────────────┐      │
│    │  BubbleVideo.tsx composition:                                        │      │
│    │                                                                      │      │
│    │  1. Scene audio tracks (full volume)                                │      │
│    │     • Each <SceneComposition> has <Audio> component                 │      │
│    │     • Voice at 100% volume                                          │      │
│    │                                                                      │      │
│    │  2. Background music track (-20dB)                                  │      │
│    │     • <Audio src={background_music_path} volume={0.01} />           │      │
│    │     • Looped to full video duration                                 │      │
│    │     • Mixed underneath voice automatically                          │      │
│    └──────────────────────────────────────────────────────────────────────┘      │
│                                      │                                           │
│                                      ▼                                           │
│    ┌──────────────────────────────────────────────────────────────────────┐      │
│    │  Remotion renderer handles:                                         │      │
│    │  • Audio mixing (voice + music)                                     │      │
│    │  • Video encoding (H.264)                                           │      │
│    │  • Audio encoding (AAC, 48kHz, Stereo)                              │      │
│    │  • Output to final_output.mp4                                       │      │
│    └──────────────────────────────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
video_generator/
├── src/
│   ├── main.ts                       # Entry point (CLI)
│   ├── orchestrator.ts               # Main pipeline orchestrator
│   ├── config.ts                     # Config loader (loads .env + defaults)
│   ├── render.ts                     # Remotion renderer wrapper
│   ├── types.ts                      # TypeScript type definitions
│   │
│   ├── services/                     # External service integrations
│   │   ├── openrouter.ts             # LLM script generation
│   │   ├── openai-tts.ts             # OpenAI TTS via OpenRouter
│   │   ├── elevenlabs.ts             # ElevenLabs TTS
│   │   ├── edge-tts.ts               # Free Edge TTS
│   │   ├── heygen.ts                 # HeyGen avatar generation
│   │   ├── pexels.ts                 # Pexels video search/download
│   │   └── music.ts                  # Background music selection
│   │
│   ├── compositions/                 # Remotion React components
│   │   ├── BubbleVideo.tsx           # Main composition (orchestrates all)
│   │   ├── SceneComposition.tsx      # Individual scene renderer
│   │   ├── TitleCard.tsx             # Title/intro card
│   │   ├── IntroVideo.tsx            # Branded intro
│   │   ├── OutroVideo.tsx            # Branded outro
│   │   ├── HighlightText.tsx         # Kinetic typography overlay
│   │   ├── Subtitles.tsx             # Subtitle renderer
│   │   └── ...
│   │
│   ├── utils/                        # Helper utilities
│   │   ├── audio.ts                  # Audio duration extraction (ffprobe)
│   │   └── video.ts                  # Video metadata extraction (ffprobe)
│   │
│   ├── Root.tsx                      # Remotion root (registers compositions)
│   ├── BubbleVideo.tsx               # Alias for compositions/BubbleVideo
│   └── index.ts                      # Remotion entry point
│
├── docs/                             # Documentation
│   ├── ARCHITECTURE_FLOW.md          # This file
│   ├── SETUP_GUIDE.md                # Installation and setup
│   ├── REMOTION_COMPONENTS_GUIDE.md  # Composition details
│   └── ELEVENLABS_SETUP.md           # ElevenLabs integration guide
│
├── assets/                           # Global assets
│   ├── logo.png                      # Brand logo
│   ├── music/                        # Background music library
│   │   ├── ambient_cinematic/
│   │   └── upbeat/
│   └── (other global assets)
│
├── projects/                         # Project isolation
│   └── {project_name}/
│       ├── raw_source.txt            # (Optional) Raw text input
│       ├── script.json               # Generated or manual script
│       ├── assets/                   # Generated assets
│       │   ├── audio/                # TTS audio files
│       │   └── video/                # Downloaded videos
│       └── final_output.mp4          # Final rendered video
│
├── .env                              # Environment variables (API keys)
├── .env.example                      # Example config
├── package.json                      # Dependencies and scripts
├── tsconfig.json                     # TypeScript configuration
├── remotion.config.ts                # Remotion configuration
├── CLAUDE.md                         # Project overview
├── VIDEO_BIBLE.md                    # Production guidelines
└── END_STATE_VISION.md               # Vision document
```

---

## Key Technical Notes

| Aspect | Value |
|--------|-------|
| **Framework** | Remotion 4.x (React-based video rendering) |
| **Runtime** | Node.js 18+ with TypeScript |
| **Resolution** | 1920x1080 (16:9) - configurable |
| **Frame Rate** | 25 fps - configurable |
| **Video Codec** | H.264 (libx264) - via Remotion |
| **Audio Codec** | AAC, 48kHz, Stereo - via Remotion |
| **Transitions** | Crossfade via @remotion/transitions |
| **Music Volume** | -20dB (0.01 volume) under voice |
| **Kinetic Font** | Inter-ExtraBold, configurable size |
| **Kinetic Color** | #667eea (Bubble Violet) |
| **Type Safety** | Full TypeScript with strict mode |

---

## Service Integration Summary

| Service | Purpose | File | Required |
|---------|---------|------|----------|
| OpenRouter | LLM script generation | `services/openrouter.ts` | Yes (for auto-generation) |
| OpenAI TTS | Text-to-speech | `services/openai-tts.ts` | Optional (can use Edge TTS) |
| ElevenLabs | Premium TTS | `services/elevenlabs.ts` | Optional |
| Edge TTS | Free TTS | `services/edge-tts.ts` | No API key needed |
| HeyGen | AI avatars | `services/heygen.ts` | Optional |
| Pexels | Stock footage | `services/pexels.ts` | Yes (for B-roll) |
| Music | Background music | `services/music.ts` | Optional |

---

## Remotion Composition Hierarchy

```
<Composition id="BubbleVideo">
  └── BubbleVideo.tsx (main orchestrator)
      ├── <Sequence> intro (if present)
      │   └── <IntroVideo />
      │
      ├── <Sequence> for each scene
      │   └── <SceneComposition scene={...} />
      │       ├── (if type === "title")
      │       │   └── <TitleCard text={...} />
      │       │
      │       ├── (if scene_type === "avatar")
      │       │   └── <Video src={avatar.mp4} />
      │       │
      │       └── (if scene_type === "broll")
      │           ├── <Video src={broll.mp4} />
      │           ├── <Audio src={audio.mp3} />
      │           ├── <Subtitles text={...} />
      │           └── (if highlight_word)
      │               └── <HighlightText word={...} />
      │
      ├── <Sequence> outro (if present)
      │   └── <OutroVideo />
      │
      └── <Audio src={background_music} volume={0.01} />
          (looped to full video duration)
</Composition>
```

---

## Quick Commands

```bash
# Preview in Remotion Studio
npm run dev

# Render video (default project)
npm run render

# Render specific project
npm run render -- --project=myproject

# Type check
npx tsc --noEmit

# Clean generated assets
rm -rf projects/*/assets/*

# Kill stuck FFmpeg
pkill -f ffmpeg

# Update Remotion
npm run upgrade
```

---

## Development Workflow

1. **Create script**: Write `raw_source.txt` or `script.json` in project folder
2. **Generate assets**: Run orchestrator to generate audio/video assets
3. **Preview**: Use `npm run dev` to preview in Remotion Studio
4. **Iterate**: Adjust compositions, timing, or services
5. **Render**: Run `npm run render` to generate final MP4
6. **Review**: Check output in `projects/{project}/final_output.mp4`

---

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  Error Handling Strategy                                        │
│                                                                 │
│  1. Service Level (try/catch in services)                       │
│     • Retry logic for transient failures                        │
│     • Fallback to default values                                │
│     • Log errors with context                                   │
│                                                                 │
│  2. Orchestrator Level (try/catch in main pipeline)             │
│     • Catch service errors                                      │
│     • Provide helpful error messages                            │
│     • Clean up partial assets                                   │
│                                                                 │
│  3. Render Level (Remotion error handling)                      │
│     • Validate input props                                      │
│     • Catch composition errors                                  │
│     • Report render failures                                    │
│                                                                 │
│  4. CLI Level (main.ts error handling)                          │
│     • Catch all unhandled errors                                │
│     • Display troubleshooting tips                              │
│     • Exit with appropriate error code                          │
└─────────────────────────────────────────────────────────────────┘
```

---

**For more details, see:**
- `CLAUDE.md` - Project overview and commands
- `SETUP_GUIDE.md` - Installation instructions
- `REMOTION_COMPONENTS_GUIDE.md` - Composition details
- `VIDEO_BIBLE.md` - Production guidelines
