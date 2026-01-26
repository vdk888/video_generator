# Architecture Flow: Bubble Video Engine

## High-Level Architecture (Clean/Hexagonal)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                    main.py                                      │
│                              (Entry Point / DI)                                 │
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                         GenerateVideoUseCase                              │  │
│  │                        (src/app/use_cases.py)                             │  │
│  │                                                                           │  │
│  │  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   │  │
│  │  │  TTSProvider│   │MediaProvider│   │  Renderer   │   │AvatarProvider│  │  │
│  │  │  (voice)    │   │  (B-roll)   │   │  (video)    │   │  (HeyGen)   │   │  │
│  │  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘   │  │
│  └─────────┼─────────────────┼─────────────────┼─────────────────┼──────────┘  │
└────────────┼─────────────────┼─────────────────┼─────────────────┼──────────────┘
             │                 │                 │                 │
    ┌────────┴────────┐  ┌─────┴─────┐    ┌──────┴──────┐   ┌──────┴──────┐
    │    ADAPTERS     │  │  ADAPTERS │    │   ADAPTERS  │   │   ADAPTERS  │
    ├─────────────────┤  ├───────────┤    ├─────────────┤   ├─────────────┤
    │ OpenAITTSAdapter│  │PexelsAdapt│    │FFmpegAdapter│   │HeyGenAdapter│
    │ ElevenLabsAdapt │  └───────────┘    └─────────────┘   └─────────────┘
    │ EdgeTTSAdapter  │
    └─────────────────┘
```

---

## Complete Pipeline Flow

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                           INPUT: raw_source.txt                                  │
│                                     │                                            │
│                                     ▼                                            │
│              ┌────────────────────────────────────────────┐                      │
│              │         OpenRouterAdapter (LLM)            │                      │
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
│                      STAGE 1: BRANDED INTRO (3s)                                 │
│              ┌────────────────────────────────────────────┐                      │
│              │            FFmpegAdapter                   │                      │
│              │  render_branded_intro()                    │                      │
│              │  • White background                        │                      │
│              │  • Logo overlay (centered)                 │                      │
│              │  • Fade-in animation                       │                      │
│              └────────────────────────────────────────────┘                      │
│                                     │                                            │
│                                     ▼                                            │
│                          intro_branded.mp4                                       │
└──────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│              STAGE 2: PROCESS EACH SCRIPT LINE (Loop)                            │
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
│    │  │FFmpeg    │         │HeyGenAdapt │          │  PARALLEL FLOW  │       │   │
│    │  │Title Card│         │  (async)   │          │                 │       │   │
│    │  │•White bg │         │•API call   │          │ ┌─────┬───────┐ │       │   │
│    │  │•Black txt│         │•Poll status│          │ │     │       │ │       │   │
│    │  │•Fade anim│         │•Download   │          │ ▼     ▼       ▼ │       │   │
│    │  └────┬─────┘         │•Normalize  │          │TTS  Media  Render│      │   │
│    │       │               └─────┬──────┘          │     Fetch       │       │   │
│    │       │                     │                 └─────────────────┘       │   │
│    │       │                     │                        │                 │   │
│    │       ▼                     ▼                        ▼                 │   │
│    │  scene_i.mp4           scene_i.mp4            scene_i.mp4              │   │
│    │  (3s title)           (avatar+audio)         (video+audio+subs)        │   │
│    │                                                                         │   │
│    └─────────────────────────────────────────────────────────────────────────┘   │
│                                     │                                            │
│                                     ▼                                            │
│                        scenes[] = [scene_0, scene_1, ...]                        │
└──────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                      STAGE 3: BRANDED OUTRO (3-5s)                               │
│              ┌────────────────────────────────────────────┐                      │
│              │            FFmpegAdapter                   │                      │
│              │  render_logo_outro()                       │                      │
│              │  • Use provided outro video                │                      │
│              │  • Logo overlay                            │                      │
│              │  • Normalize format                        │                      │
│              └────────────────────────────────────────────┘                      │
│                                     │                                            │
│                                     ▼                                            │
│                      scenes.append(outro_normalized.mp4)                         │
└──────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                     STAGE 4: MUSIC SELECTION (Optional)                          │
│              ┌────────────────────────────────────────────┐                      │
│              │            MusicAdapter                    │                      │
│              │  get_music_track(mood)                     │                      │
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
│                 STAGE 5: CONCATENATE WITH TRANSITIONS                            │
│              ┌────────────────────────────────────────────┐                      │
│              │            FFmpegAdapter                   │                      │
│              │  concat_scenes(scenes[], music_path)       │                      │
│              │                                            │                      │
│              │  VIDEO CHAIN:                              │                      │
│              │  • xfade filter (0.4s transitions)         │                      │
│              │  • All scenes linked with fades            │                      │
│              │                                            │                      │
│              │  AUDIO CHAIN:                              │                      │
│              │  • acrossfade between scenes               │                      │
│              │  • Music loop + trim to video length       │                      │
│              │  • Music fade in (0.5s) / out (0.5s)       │                      │
│              │  • Music volume -20dB                      │                      │
│              │  • amix (voice + music)                    │                      │
│              │                                            │                      │
│              │  OUTPUT FORMAT:                            │                      │
│              │  • 1920x1080 @ 25fps                       │                      │
│              │  • yuv420p pixel format                    │                      │
│              │  • H.264 video / AAC audio                 │                      │
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
│  │  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────┐   │    │
│  │  │  1. TTS (async) │    │  2. MEDIA FETCH │    │  (waits for 1 & 2)  │   │    │
│  │  │                 │    │                 │    │                     │   │    │
│  │  │ TTSProvider     │    │ MediaProvider   │    │  3. RENDER SCENE    │   │    │
│  │  │ .generate_audio │    │ .search_video   │    │                     │   │    │
│  │  │                 │    │                 │    │  FFmpegAdapter      │   │    │
│  │  │ ┌─────────────┐ │    │ ┌─────────────┐ │    │  .render_scene()    │   │    │
│  │  │ │OpenAI TTS   │ │    │ │Pexels API   │ │    │                     │   │    │
│  │  │ │or ElevenLabs│ │    │ │Search       │ │    │  • Loop video to    │   │    │
│  │  │ │or Edge TTS  │ │    │ │Download HD  │ │    │    match audio dur  │   │    │
│  │  │ └─────────────┘ │    │ │Filter 16:9  │ │    │  • Mix audio track  │   │    │
│  │  │        │        │    │ └─────────────┘ │    │  • Burn ASS subs    │   │    │
│  │  │        ▼        │    │        │        │    │  • Kinetic text     │   │    │
│  │  │  ┌──────────┐   │    │        ▼        │    │    (if highlight)   │   │    │
│  │  │  │audio.mp3 │   │    │  ┌──────────┐   │    │  • yuv420p output   │   │    │
│  │  │  │audio.ass │   │    │  │video.mp4 │   │    │                     │   │    │
│  │  │  │(subtitles│   │    │  │(raw HD)  │   │    │                     │   │    │
│  │  │  └──────────┘   │    │  └──────────┘   │    │                     │   │    │
│  │  └────────┬────────┘    └────────┬────────┘    └──────────┬──────────┘   │    │
│  │           │                      │                        │              │    │
│  │           └──────────────────────┴────────────────────────┘              │    │
│  │                                  │                                       │    │
│  │                                  ▼                                       │    │
│  │                          scene_i.mp4                                     │    │
│  │                    (complete rendered scene)                             │    │
│  └──────────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## Kinetic Typography (Highlight) Flow

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│               KINETIC TYPOGRAPHY (when highlight_word present)                   │
│                                                                                  │
│  INPUT:                                                                          │
│    video.mp4 (B-roll)                                                            │
│    audio.mp3 (voice)                                                             │
│    highlight_word: "transformer"                                                 │
│                                                                                  │
│  FFMPEG FILTER CHAIN:                                                            │
│                                                                                  │
│    ┌──────────────────────────────────────────────────────────────────────┐      │
│    │  [0:v] ──► eq=brightness=-0.4 ──► [darkened]                        │      │
│    │                                                                      │      │
│    │                         (Background dimmed)                          │      │
│    └──────────────────────────────────────────────────────────────────────┘      │
│                                      │                                           │
│                                      ▼                                           │
│    ┌──────────────────────────────────────────────────────────────────────┐      │
│    │  [text_image] ──► (generated PNG with "TRANSFORMER")                │      │
│    │                                                                      │      │
│    │  • Font: Inter-ExtraBold 170pt                                       │      │
│    │  • Color: #667eea (Bubble Violet)                                    │      │
│    │  • Position: Centered                                                │      │
│    │  • Background: Transparent                                           │      │
│    └──────────────────────────────────────────────────────────────────────┘      │
│                                      │                                           │
│                                      ▼                                           │
│    ┌──────────────────────────────────────────────────────────────────────┐      │
│    │  [darkened] + [text_image] ──► overlay ──► [final]                  │      │
│    │                                                                      │      │
│    │  Text overlaid on dimmed video                                       │      │
│    └──────────────────────────────────────────────────────────────────────┘      │
│                                      │                                           │
│                                      ▼                                           │
│    ┌──────────────────────────────────────────────────────────────────────┐      │
│    │  + audio.mp3 ──► scene_i.mp4                                        │      │
│    │                                                                      │      │
│    │  (Also burns ASS subtitles for other text)                           │      │
│    └──────────────────────────────────────────────────────────────────────┘      │
│                                                                                  │
│  OUTPUT: scene_i.mp4 with kinetic text overlay                                   │
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
│  │                         HeyGenAdapter (async)                            │    │
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
│  │  │  Stream download → avatar_raw.mp4                                  │  │    │
│  │  │  (URL expires in 7 days - must download immediately)               │  │    │
│  │  └────────────────────────────────────────────────────────────────────┘  │    │
│  │                              │                                           │    │
│  │                              ▼                                           │    │
│  │  STEP 4: Normalize Video                                                 │    │
│  │  ┌────────────────────────────────────────────────────────────────────┐  │    │
│  │  │  FFmpeg normalization:                                             │  │    │
│  │  │  • Scale to 1920x1080 (pad if needed)                              │  │    │
│  │  │  • Set framerate to 25fps                                          │  │    │
│  │  │  • Convert to yuv420p                                              │  │    │
│  │  │  • Audio: AAC 48kHz stereo                                         │  │    │
│  │  └────────────────────────────────────────────────────────────────────┘  │    │
│  │                              │                                           │    │
│  │                              ▼                                           │    │
│  │                        scene_i.mp4                                       │    │
│  │                  (avatar video with voice)                               │    │
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
│                      MUSIC MIXING (in concat_scenes)                             │
│                                                                                  │
│  INPUTS:                                                                         │
│    video_with_voice.mp4  (concatenated scenes with voice)                        │
│    background_music.mp3  (from MusicAdapter)                                     │
│                                                                                  │
│  FFMPEG AUDIO FILTER CHAIN:                                                      │
│                                                                                  │
│    ┌──────────────────────────────────────────────────────────────────────┐      │
│    │  [music] ──► aloop=loop=-1 ──► (infinite loop)                      │      │
│    │                    │                                                 │      │
│    │                    ▼                                                 │      │
│    │            atrim=0:{video_duration} ──► (trim to video length)       │      │
│    │                    │                                                 │      │
│    │                    ▼                                                 │      │
│    │            afade=t=in:d=0.5 ──► (fade in 0.5s)                       │      │
│    │                    │                                                 │      │
│    │                    ▼                                                 │      │
│    │            afade=t=out:d=0.5:st={end-0.5} ──► (fade out 0.5s)        │      │
│    │                    │                                                 │      │
│    │                    ▼                                                 │      │
│    │            volume=-20dB ──► [music_processed]                        │      │
│    └──────────────────────────────────────────────────────────────────────┘      │
│                                      │                                           │
│                                      ▼                                           │
│    ┌──────────────────────────────────────────────────────────────────────┐      │
│    │  [voice] + [music_processed] ──► amix=inputs=2 ──► [final_audio]    │      │
│    │                                                                      │      │
│    │  (Voice at full volume, music at -20dB underneath)                   │      │
│    └──────────────────────────────────────────────────────────────────────┘      │
│                                      │                                           │
│                                      ▼                                           │
│    ┌──────────────────────────────────────────────────────────────────────┐      │
│    │  [video] + [final_audio] ──► final_output.mp4                       │      │
│    └──────────────────────────────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
video_generator/
├── main.py                          ← Entry point (DI container)
├── .env                             ← API keys & config
├── raw_source.txt                   ← Input text (or in projects/)
├── script.json                      ← Generated/manual script
├── final_output.mp4                 ← Output video
│
├── src/
│   ├── domain/
│   │   └── models.py               ← ScriptLine, Scene, AudioAsset, VideoAsset
│   │
│   ├── ports/
│   │   └── interfaces.py            ← TTSProvider, MediaProvider, Renderer, etc.
│   │
│   ├── adapters/
│   │   ├── ffmpeg_adapter.py        ← Video rendering, transitions, music
│   │   ├── openrouter_adapter.py    ← LLM script enrichment
│   │   ├── pexels_adapter.py        ← B-roll search & download
│   │   ├── openai_tts_adapter.py    ← OpenAI/OpenRouter TTS
│   │   ├── elevenlabs_adapter.py    ← ElevenLabs TTS
│   │   ├── edge_tts_adapter.py      ← Free Edge TTS
│   │   ├── heygen_adapter.py        ← AI avatar generation
│   │   └── music_adapter.py         ← Background music selection
│   │
│   ├── app/
│   │   └── use_cases.py             ← GenerateVideoUseCase (orchestration)
│   │
│   └── infra/
│       └── config.py                ← Environment/config loading
│
├── assets/
│   ├── logo.png                     ← Brand logo
│   ├── music/                       ← Background music library
│   │   ├── ambient_cinematic/
│   │   └── upbeat/
│   └── (generated assets)
│
├── projects/                        ← Project isolation
│   └── {project_name}/
│       ├── raw_source.txt
│       ├── script.json
│       ├── assets/
│       └── final_output.mp4
│
└── docs/
    ├── VIDEO_BIBLE.md               ← Production guidelines
    ├── END_STATE_VISION.md          ← Vision document
    └── ARCHITECTURE_FLOW.md         ← This file
```

---

## Key Technical Notes

| Aspect | Value |
|--------|-------|
| **Resolution** | 1920x1080 (16:9) |
| **Frame Rate** | 25 fps |
| **Pixel Format** | yuv420p (required) |
| **Video Codec** | H.264 (libx264) |
| **Audio Codec** | AAC, 48kHz, Stereo |
| **Transition** | xfade, 0.4s default |
| **Music Volume** | -20dB under voice |
| **Kinetic Font** | Inter-ExtraBold, 170pt |
| **Kinetic Color** | #667eea (Bubble Violet) |

---

## Quick Commands

```bash
# Generate video
python main.py --project default

# Clean generated assets
rm assets/scene_*.mp4 assets/audio_*.mp3 assets/video_raw_*.mp4

# Kill stuck FFmpeg
pkill -f ffmpeg

# Switch TTS provider
export TTS_PROVIDER=elevenlabs  # or openai, edge
```
