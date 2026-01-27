# Setup Guide: Bubble Video Engine (TypeScript + Remotion)

This guide will help you set up and run the Bubble Video Engine on your local machine.

## Prerequisites

### Required Software

1. **Node.js 18+**
   - Download from: https://nodejs.org/
   - Verify installation: `node --version` (should show v18.x or higher)

2. **npm** (comes with Node.js)
   - Verify installation: `npm --version`

3. **FFmpeg** (required by Remotion for rendering)
   - **macOS**: `brew install ffmpeg`
   - **Linux**: `sudo apt install ffmpeg`
   - **Windows**: Download from https://ffmpeg.org/download.html
   - Verify installation: `ffmpeg -version` and `ffprobe -version`

4. **Git** (for cloning the repository)
   - Download from: https://git-scm.com/

### API Keys (Required)

You'll need API keys for the following services:

1. **OpenRouter** (for script generation and OpenAI TTS)
   - Sign up at: https://openrouter.ai/
   - Used for: LLM-powered script enrichment, optional TTS via OpenAI

2. **Pexels** (for stock footage)
   - Sign up at: https://www.pexels.com/api/
   - Used for: Downloading royalty-free B-roll videos

### API Keys (Optional)

3. **ElevenLabs** (optional, for high-quality TTS)
   - Sign up at: https://elevenlabs.io/
   - Used for: Premium text-to-speech generation

4. **HeyGen** (optional, for AI avatars)
   - Sign up at: https://www.heygen.com/
   - Used for: Generating talking head videos with AI avatars

> **Note**: You can use Edge TTS (free, no API key required) instead of OpenAI or ElevenLabs.

---

## Installation

### Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd video_generator
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install:
- Remotion (video rendering framework)
- TypeScript and type definitions
- dotenv (environment variable management)
- Zod (schema validation)
- All other required packages

### Step 3: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and fill in your API keys:
   ```bash
   # Required
   OPENROUTER_API_KEY=your_openrouter_key_here
   PEXELS_API_KEY=your_pexels_key_here

   # Optional (TTS)
   ELEVENLABS_API_KEY=your_elevenlabs_key_here

   # Optional (Avatar)
   HEYGEN_API_KEY=your_heygen_key_here

   # Configuration
   TTS_PROVIDER=openai  # Options: openai, elevenlabs, edge
   ```

3. Save the file.

### Step 4: Verify Installation

Check that TypeScript compiles without errors:
```bash
npx tsc --noEmit
```

Check that FFmpeg is available:
```bash
ffmpeg -version
ffprobe -version
```

---

## First Run

### Option 1: Generate from Raw Text

1. Create a project folder and raw text file:
   ```bash
   mkdir -p projects/test
   echo "Welcome to Bubble Video Engine. This is a test video." > projects/test/raw_source.txt
   ```

2. Render the video:
   ```bash
   npm run render -- --project=test
   ```

3. Find your output:
   ```bash
   ls projects/test/final_output.mp4
   ```

### Option 2: Use Pre-Made Script (Director Mode)

1. Create a project folder with a structured script:
   ```bash
   mkdir -p projects/demo
   ```

2. Create `projects/demo/script.json`:
   ```json
   [
     {
       "text": "Introduction",
       "type": "title",
       "scene_type": "title"
     },
     {
       "text": "Welcome to our video about artificial intelligence.",
       "type": "speech",
       "scene_type": "broll",
       "search_query": "futuristic technology AI digital",
       "highlight_word": "artificial intelligence"
     },
     {
       "text": "Thank you for watching!",
       "type": "speech",
       "scene_type": "broll",
       "search_query": "happy people smiling gratitude"
     }
   ]
   ```

3. Render the video:
   ```bash
   npm run render -- --project=demo
   ```

---

## Using Remotion Studio (Preview)

Remotion Studio allows you to preview and edit compositions in a browser:

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open your browser (it should open automatically at http://localhost:3000)

3. Select the "BubbleVideo" composition

4. Adjust props and preview the video interactively

5. Use the timeline to scrub through the video

> **Note**: Studio is for preview only - you still need to run `npm run render` to generate the final MP4.

---

## Configuration Options

### TTS Providers

Set `TTS_PROVIDER` in `.env`:

- **openai**: OpenAI TTS via OpenRouter (requires `OPENROUTER_API_KEY`)
  - Good quality, fast, affordable
  - Voice: `alloy` (default)

- **elevenlabs**: ElevenLabs TTS (requires `ELEVENLABS_API_KEY`)
  - Premium quality, natural-sounding
  - Voice: Configurable via `ELEVENLABS_VOICE_ID`

- **edge**: Edge TTS (free, no API key)
  - Free, decent quality
  - Voice: `en-US-AriaNeural` (default)

### Background Music

Enable background music in `.env`:
```bash
ENABLE_BACKGROUND_MUSIC=true
MUSIC_MOOD=ambient_cinematic
```

Place music files in:
```
assets/music/ambient_cinematic/*.mp3
assets/music/upbeat/*.mp3
```

### Avatar Settings

Configure HeyGen avatars in `.env`:
```bash
HEYGEN_API_KEY=your_key_here
HEYGEN_DEFAULT_AVATAR_ID=your_avatar_id
HEYGEN_DEFAULT_VOICE_ID=your_voice_id
```

To use avatar scenes, set `scene_type: "avatar"` in your script.

---

## Project Structure

After setup, your project should look like this:

```
video_generator/
├── src/                        # TypeScript source code
│   ├── main.ts                 # CLI entry point
│   ├── orchestrator.ts         # Main pipeline
│   ├── config.ts               # Configuration loader
│   ├── render.ts               # Remotion renderer
│   ├── types.ts                # Type definitions
│   ├── services/               # External APIs
│   ├── compositions/           # React components
│   └── utils/                  # Helpers
├── projects/                   # Project workspaces
│   ├── test/
│   │   ├── raw_source.txt      # Input text
│   │   ├── script.json         # Generated/manual script
│   │   ├── assets/             # Generated audio/video
│   │   └── final_output.mp4    # Final video
│   └── demo/
│       └── ...
├── assets/                     # Global assets
│   ├── logo.png                # Your logo
│   └── music/                  # Background music library
├── docs/                       # Documentation
├── .env                        # Your API keys (DO NOT COMMIT)
├── .env.example                # Example config
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
├── remotion.config.ts          # Remotion config
└── CLAUDE.md                   # Project overview

```

---

## Common Tasks

### Render a Video

```bash
npm run render -- --project=myproject
```

### Clean Generated Assets

```bash
rm -rf projects/myproject/assets/*
```

### Kill Stuck FFmpeg Process

```bash
pkill -f ffmpeg
```

### Check TypeScript Errors

```bash
npx tsc --noEmit
```

### Update Remotion

```bash
npm run upgrade
```

---

## Troubleshooting

### "Cannot find module" or Import Errors

- Run `npm install` to ensure all dependencies are installed
- Check that you're using Node.js 18+: `node --version`

### "ffmpeg not found" or "ffprobe not found"

- Install FFmpeg: `brew install ffmpeg` (macOS) or `sudo apt install ffmpeg` (Linux)
- Verify: `ffmpeg -version` and `ffprobe -version`

### "API key not set" or "Unauthorized"

- Check `.env` file exists and contains valid API keys
- Verify keys are not wrapped in quotes
- Ensure `.env` is in the project root

### "No script found"

- Ensure either `script.json` or `raw_source.txt` exists in the project folder
- Example: `projects/myproject/raw_source.txt`

### Render Hangs or Takes Too Long

- Check system resources (CPU, RAM)
- Kill any stuck FFmpeg processes: `pkill -f ffmpeg`
- Reduce video resolution in `remotion.config.ts` for faster testing

### Generated Video Has No Audio

- Check that TTS provider is configured correctly in `.env`
- Verify audio files are generated in `projects/myproject/assets/audio/`
- Check console output for TTS errors

### Generated Video Has No Visuals

- Check that Pexels API key is valid
- Verify video files are downloaded to `projects/myproject/assets/video/`
- Check console output for Pexels errors

---

## Next Steps

- Read `CLAUDE.md` for project overview and commands
- Read `docs/ARCHITECTURE_FLOW.md` for pipeline details
- Read `VIDEO_BIBLE.md` for production guidelines
- Read `docs/REMOTION_COMPONENTS_GUIDE.md` for composition details

## Getting Help

- Check existing documentation in `docs/`
- Review console output for error messages
- Enable verbose mode: `VERBOSE=true npm run render -- --project=myproject`

---

**You're all set! 🚀 Start creating videos with `npm run render`**
