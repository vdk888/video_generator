# HeyGen Avatar Integration

## Overview

The Bubble Video Engine now supports AI avatar video generation using the HeyGen API. This allows you to create talking head segments with realistic AI avatars that speak your script text.

## Features

- **AI Avatar Videos**: Generate realistic talking head videos from text
- **Mixed Scene Types**: Combine avatar, b-roll, and title card scenes in one video
- **Automatic Normalization**: Avatar videos are normalized to 1920x1080@25fps yuv420p for pipeline compatibility
- **Async Generation**: Non-blocking video generation with status polling
- **Clean Architecture**: Follows the adapter pattern for easy swapping/testing

## Setup

### 1. Get HeyGen API Key

1. Sign up at [HeyGen](https://www.heygen.com/)
2. Navigate to API settings
3. Generate an API key

### 2. Configure Environment

Add to your `.env` file:

```bash
# HeyGen Configuration
HEYGEN_API_KEY=your_api_key_here

# Optional: Customize default avatar and voice
HEYGEN_DEFAULT_AVATAR_ID=Angela-inblackskirt-20220820
HEYGEN_DEFAULT_VOICE_ID=1bd001e7e50f421d891986aad5158bc8
```

### 3. Install Dependencies

The HeyGen adapter requires `aiohttp` for async HTTP requests:

```bash
pip install aiohttp
```

## Usage

### Script Format

Add `scene_type` field to your script.json entries:

```json
[
  {
    "text": "Welcome to this tutorial!",
    "type": "speech",
    "scene_type": "avatar"
  },
  {
    "text": "Let's explore the technology.",
    "search_query": "technology innovation",
    "type": "speech",
    "scene_type": "broll"
  },
  {
    "text": "Key Features",
    "type": "title",
    "scene_type": "title"
  }
]
```

### Scene Types

- **`broll`** (default): Stock footage from Pexels with generated audio
- **`avatar`**: AI avatar speaking the text (includes audio)
- **`title`**: Static or animated title card

### Running the Pipeline

```bash
# Standard usage
venv/bin/python main.py --project my_project

# The engine will automatically use HeyGen for scenes marked with scene_type="avatar"
```

### Testing Avatar Generation

Use the test script to verify your HeyGen setup:

```bash
# Test basic avatar generation
venv/bin/python test_avatar.py
# Choose option 1 for API test

# Create example mixed script
venv/bin/python test_avatar.py
# Choose option 2 to generate example script
```

## Architecture

### Components

1. **AvatarProvider Interface** (`src/ports/interfaces.py`)
   - Defines the contract for avatar generation
   - Allows swapping providers (HeyGen, D-ID, etc.)

2. **HeyGenAdapter** (`src/adapters/heygen_adapter.py`)
   - Implements AvatarProvider protocol
   - Handles API communication, polling, download, normalization

3. **GenerateVideoUseCase** (`src/app/use_cases.py`)
   - Routes scenes based on scene_type
   - Orchestrates avatar, broll, and title generation

### Video Generation Flow

```
Script with scene_type="avatar"
  ↓
GenerateVideoUseCase routes to HeyGenAdapter
  ↓
1. Submit generation request to HeyGen API
2. Poll status endpoint (5s intervals, 10min timeout)
3. Download completed video
4. Normalize to 1920x1080@25fps yuv420p
  ↓
Add to scene list for concatenation
```

## Configuration

### Default Avatar and Voice

The system uses defaults from config, but you can override per-scene in script.json:

```json
{
  "text": "Custom avatar scene",
  "scene_type": "avatar",
  "avatar_id": "custom_avatar_id",
  "voice_id": "custom_voice_id"
}
```

### Available Avatars and Voices

Refer to [HeyGen documentation](https://docs.heygen.com/) for:
- Available avatar IDs
- Available voice IDs
- Language support
- Pricing tiers

## Technical Details

### Video Normalization

Avatar videos are normalized using FFmpeg to ensure compatibility:

```bash
ffmpeg -i input.mp4 \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black" \
  -r 25 \
  -c:v libx264 \
  -pix_fmt yuv420p \
  -c:a aac \
  -ar 48000 \
  -ac 2 \
  output.mp4
```

This ensures:
- Resolution: 1920x1080
- Frame rate: 25fps
- Pixel format: yuv420p (critical for compatibility)
- Audio: AAC 48kHz stereo

### Polling Strategy

- **Poll interval**: 5 seconds
- **Timeout**: 10 minutes (600 seconds)
- **Status checks**: `pending` → `processing` → `completed` or `failed`

### Error Handling

The adapter handles:
- API key validation
- Network errors
- Generation timeouts
- Malformed API responses
- Download failures
- Normalization errors

## Limitations

1. **Cost**: HeyGen API charges per video generation (check pricing)
2. **Generation Time**: Avatar videos take 30s-5min to generate
3. **Video Duration**: HeyGen may have limits on video length
4. **Language Support**: Depends on HeyGen's available voices
5. **Fallback**: If avatar provider not configured, scenes fall back to broll

## Troubleshooting

### "HEYGEN_API_KEY not found"
- Ensure `.env` file exists in project root
- Check that `HEYGEN_API_KEY=...` is set
- Restart if environment was recently updated

### "Avatar scene requested but no avatar provider configured"
- Check that HEYGEN_API_KEY is set in .env
- Verify avatar service initialization in main.py logs
- If key is missing, scene falls back to broll

### "HeyGen API error (status 401)"
- Invalid or expired API key
- Check your HeyGen account status

### "Video generation timed out"
- HeyGen service may be slow or down
- Try again later or increase timeout in adapter

### "FFmpeg normalization failed"
- Check that FFmpeg is installed: `ffmpeg -version`
- Verify downloaded video is valid
- Check disk space

## Examples

### Simple Avatar Introduction

```json
[
  {
    "text": "Hello! I'm here to introduce Bubble's new product.",
    "scene_type": "avatar"
  },
  {
    "text": "Product Features",
    "type": "title",
    "scene_type": "title"
  },
  {
    "text": "Let me show you what makes it special.",
    "search_query": "innovative product showcase",
    "scene_type": "broll"
  }
]
```

### Tutorial Format

```json
[
  {
    "text": "Welcome to this tutorial on video automation.",
    "scene_type": "avatar"
  },
  {
    "text": "Step 1: Setup",
    "type": "title",
    "scene_type": "title"
  },
  {
    "text": "First, configure your environment.",
    "scene_type": "avatar"
  },
  {
    "text": "Here's how the configuration works.",
    "search_query": "software configuration setup",
    "scene_type": "broll"
  }
]
```

### Marketing Video

```json
[
  {
    "text": "Introducing our revolutionary AI platform.",
    "scene_type": "avatar"
  },
  {
    "text": "Trusted by thousands of companies worldwide.",
    "search_query": "business success teamwork",
    "scene_type": "broll"
  },
  {
    "text": "Join us today and transform your workflow.",
    "scene_type": "avatar"
  }
]
```

## Future Enhancements

- [ ] Support for custom avatar backgrounds
- [ ] Gesture and emotion controls
- [ ] Multiple avatars in same video
- [ ] Avatar position/size customization
- [ ] Integration with other avatar providers (D-ID, Synthesia)
- [ ] Caching generated avatar videos
- [ ] Avatar-specific voice matching

## API Reference

### HeyGenAdapter

```python
class HeyGenAdapter:
    def __init__(self, api_key: str)

    async def generate_avatar_video(
        self,
        text: str,
        avatar_id: str,
        voice_id: str,
        output_path: Path
    ) -> Path
```

### Configuration Fields

```python
@dataclass
class ProjectConfig:
    # ... other fields ...
    heygen_api_key: str = ""
    heygen_default_avatar_id: str = "Angela-inblackskirt-20220820"
    heygen_default_voice_id: str = "1bd001e7e50f421d891986aad5158bc8"
```

### Script Line Fields

```python
@dataclass
class ScriptLine:
    text: str
    search_query: str = ""
    type: str = "speech"
    highlight_word: Optional[str] = None
    custom_media_path: Optional[str] = None
    scene_type: str = "broll"  # "broll", "avatar", or "title"
```

## Support

For HeyGen-specific issues, consult:
- [HeyGen Documentation](https://docs.heygen.com/)
- [HeyGen API Reference](https://docs.heygen.com/reference/api-overview)
- [HeyGen Support](https://www.heygen.com/support)

For integration issues, check:
- Implementation log: `.claude/implementation-log.md`
- Test script: `test_avatar.py`
- Adapter source: `src/adapters/heygen_adapter.py`
