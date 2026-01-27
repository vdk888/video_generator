# CLAUDE.md

## Project: Bubble Video Engine
A TypeScript-based automated video generation pipeline using Remotion and service-oriented architecture.

## End Vision
A zero-edit AI video pipeline producing broadcast-quality content:
- **Voice**: OpenAI TTS / ElevenLabs (high-quality, natural)
- **Avatar**: HeyGen integration for talking head segments
- **B-Roll**: Pexels stock footage with semantic search
- **Structure**: Hook → Parts → CTA → Outro
- **Polish**: Transitions, background music, kinetic typography
- **Branding**: Consistent intro/outro, logo, color palette

**Key Documents**:
- `VIDEO_BIBLE.md` - Production guidelines, timing, visual grammar
- `END_STATE_VISION.md` - Full vision and implementation roadmap
- `Charte Graphique Bubble...md` - Official brand guidelines (colors, fonts, logo)
- `docs/SETUP_GUIDE.md` - Installation and setup instructions
- `docs/ARCHITECTURE_FLOW.md` - Technical architecture and pipeline flow
- `docs/REMOTION_COMPONENTS_GUIDE.md` - Remotion composition reference

## Commands
- **Development Studio**: `npm run dev` (Opens Remotion Studio for preview and editing)
- **Render Video**: `npm run render` (Renders video using `default` project)
- **Render Specific Project**: `npm run render -- --project=myproject`
- **Install Dependencies**: `npm install`
- **Type Check**: `npx tsc --noEmit`
- **Upgrade Remotion**: `npm run upgrade`
- **Clean Assets**: `rm -rf projects/*/assets/*` (Recommended before full runs)
- **Kill FFmpeg Process**: `pkill -f ffmpeg` (If stuck during render)

## Architecture
- **Pattern**: Service-Oriented Architecture with Remotion compositions
- **Core Orchestrator**: `src/orchestrator.ts` controls the pipeline flow
- **Services**: Modular services in `src/services/`:
  - `openrouter.ts`: LLM script enrichment
  - `openai-tts.ts`, `elevenlabs.ts`, `edge-tts.ts`: Text-to-speech providers
  - `heygen.ts`: AI avatar generation
  - `pexels.ts`: Stock footage search and download
  - `music.ts`: Background music selection
- **Compositions**: Remotion visual components in `src/compositions/`:
  - `BubbleVideo.tsx`: Main composition orchestrator
  - `SceneComposition.tsx`: Individual scene renderer
  - `TitleCard.tsx`: Title/intro card renderer
  - `IntroVideo.tsx`, `OutroVideo.tsx`: Branded intro/outro
- **Renderer**: `src/render.ts` wraps Remotion's programmatic rendering API
- **Configuration**: `src/config.ts` loads settings from `.env` and provides defaults

## Code Style
- **Type Safety**: TypeScript with strict mode enabled
- **Async/Await**: Used heavily for IO-bound tasks (TTS, LLM, video rendering)
- **Imports**: ES modules with explicit `.js` extensions
- **React**: Functional components with hooks for Remotion compositions
- **Zod**: Runtime schema validation for configuration

## Tech Stack
- **Runtime**: Node.js 18+ with TypeScript
- **Video Framework**: Remotion 4.x (React-based video rendering)
- **Rendering**: FFmpeg (via Remotion's renderer)
- **HTTP**: Native `fetch` API for external services
- **Configuration**: dotenv for environment variables

## Key "Gotchas"
- **Remotion Studio**: Use `npm run dev` to preview compositions in browser before rendering
- **FFmpeg Dependency**: Remotion requires FFmpeg and FFprobe to be installed and available in PATH
- **Script Generation**: `ScriptGenerator` (OpenRouter) is skipped if `script.json` already exists (Director Mode). Delete `script.json` to force regeneration from `raw_source.txt`.
- **Audio Timing**: Scene durations are determined by audio length - ensure TTS generates audio with proper pacing
- **Custom Media**: When using `custom_media_path` with images (`.png`, `.jpg`), they are rendered as static frames for the audio duration
- **API Keys**: Ensure all required API keys are set in `.env` (see `.env.example`)
- **Project Isolation**: Each project gets its own folder under `projects/` with isolated assets and output

## Project Structure
```
video_generator/
├── src/
│   ├── main.ts                  # Entry point (CLI)
│   ├── orchestrator.ts          # Main pipeline orchestrator
│   ├── config.ts                # Configuration loader
│   ├── render.ts                # Remotion renderer wrapper
│   ├── types.ts                 # TypeScript interfaces
│   ├── services/                # External service integrations
│   │   ├── openrouter.ts
│   │   ├── openai-tts.ts
│   │   ├── elevenlabs.ts
│   │   ├── edge-tts.ts
│   │   ├── heygen.ts
│   │   ├── pexels.ts
│   │   └── music.ts
│   ├── compositions/            # Remotion React components
│   │   ├── BubbleVideo.tsx      # Main composition
│   │   ├── SceneComposition.tsx
│   │   ├── TitleCard.tsx
│   │   ├── IntroVideo.tsx
│   │   ├── OutroVideo.tsx
│   │   └── ...
│   └── utils/                   # Helper utilities
│       ├── audio.ts
│       └── video.ts
├── docs/                        # Documentation
│   ├── ARCHITECTURE_FLOW.md
│   ├── SETUP_GUIDE.md
│   ├── REMOTION_COMPONENTS_GUIDE.md
│   └── ELEVENLABS_SETUP.md
├── assets/                      # Global assets
│   ├── logo.png
│   └── music/
├── projects/                    # Project isolation
│   └── {project_name}/
│       ├── raw_source.txt       # (Optional) Raw text for LLM
│       ├── script.json          # (Optional) Structured script
│       ├── assets/              # Generated audio/video
│       └── final_output.mp4     # Final rendered video
├── .env                         # Environment variables (API keys)
├── package.json                 # Dependencies and scripts
├── tsconfig.json                # TypeScript configuration
├── remotion.config.ts           # Remotion configuration
├── CLAUDE.md                    # This file
├── VIDEO_BIBLE.md               # Production guidelines
└── END_STATE_VISION.md          # Vision document

```

## Quick Start
```bash
# 1. Install dependencies
npm install

# 2. Configure environment (copy .env.example to .env and fill in API keys)
cp .env.example .env

# 3. Create a project with a script
mkdir -p projects/myproject
echo "Your video script text here..." > projects/myproject/raw_source.txt

# 4. Preview in Remotion Studio (optional)
npm run dev

# 5. Render video
npm run render -- --project=myproject

# 6. Find output
ls projects/myproject/final_output.mp4
```

## Development Workflow
1. **Write Script**: Create `raw_source.txt` or `script.json` in project folder
2. **Preview**: Use `npm run dev` to open Remotion Studio and preview compositions
3. **Iterate**: Adjust script, compositions, or service settings
4. **Render**: Run `npm run render` to generate final video
5. **Review**: Check `final_output.mp4` in project folder

## Troubleshooting
- **"Cannot find ffmpeg"**: Install FFmpeg (`brew install ffmpeg` on macOS)
- **"API key not set"**: Check `.env` file has all required keys
- **"No script found"**: Create `script.json` or `raw_source.txt` in project folder
- **Render stuck**: Kill FFmpeg process with `pkill -f ffmpeg`
- **Type errors**: Run `npx tsc --noEmit` to check TypeScript errors
