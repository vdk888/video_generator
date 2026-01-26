# ElevenLabs TTS Setup Guide

## Overview

ElevenLabs is now available as a premium TTS provider in the Bubble Video Engine, offering high-quality, natural-sounding voices with multilingual support.

## Quick Start

### 1. Get Your API Key

1. Sign up at [ElevenLabs](https://elevenlabs.io/)
2. Navigate to your profile settings
3. Copy your API key

### 2. Configure Environment

Add to your `.env` file:

```bash
# TTS Provider Selection
TTS_PROVIDER=elevenlabs

# ElevenLabs API Key
ELEVENLABS_API_KEY=your_api_key_here

# Optional: Voice Selection
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL  # Bella (French female, default)
```

### 3. Run the Engine

```bash
venv/bin/python main.py
```

The engine will automatically use ElevenLabs for all TTS generation.

---

## Voice Selection

### Recommended French Voices

| Voice Name | Voice ID | Gender | Description |
|------------|----------|--------|-------------|
| **Bella** | `EXAVITQu4vr4xnSDxMaL` | Female | Clear, professional (default) |
| **Adam** | `pNInz6obpgDQGcFmaJgB` | Male | Warm, authoritative |

### Finding More Voices

1. Visit [ElevenLabs Voice Library](https://elevenlabs.io/voice-library)
2. Preview voices
3. Copy the Voice ID
4. Set `ELEVENLABS_VOICE_ID` in your `.env`

---

## Provider Comparison

| Feature | ElevenLabs | OpenAI TTS | Edge TTS |
|---------|-----------|------------|----------|
| **Quality** | Excellent | Very Good | Good |
| **Cost** | Paid | Paid | Free |
| **Languages** | 29+ | 50+ | 100+ |
| **Naturalness** | Very High | High | Medium |
| **Speed** | Fast | Fast | Fast |
| **Word Timings** | No | No | Yes |

### When to Use Each

- **ElevenLabs**: Premium content, brand voice consistency
- **OpenAI TTS**: General purpose, multi-language support
- **Edge TTS**: Development, testing, free tier

---

## Testing

Test the ElevenLabs adapter in isolation:

```bash
venv/bin/python test_elevenlabs.py
```

This will:
1. Generate a test audio file
2. Create subtitles (ASS format)
3. Verify compatibility with FFmpeg pipeline

---

## Troubleshooting

### "ELEVENLABS_API_KEY not found"

**Solution**: Add your API key to `.env`:
```bash
ELEVENLABS_API_KEY=sk_your_actual_key_here
```

### API Rate Limits

**Free Tier**: 10,000 characters/month
**Solution**: Upgrade plan or switch to `TTS_PROVIDER=edge` for testing

### Voice Not Found

**Error**: `404 Voice not found`
**Solution**: Verify voice ID at [ElevenLabs Voice Lab](https://elevenlabs.io/voice-lab)

### Audio Quality Issues

**Check**:
1. Voice settings (stability, similarity_boost) in `elevenlabs_adapter.py`
2. Model version (`eleven_multilingual_v2` is recommended)
3. Input text quality (punctuation, formatting)

---

## Advanced Configuration

### Custom Voice Settings

Edit `src/adapters/elevenlabs_adapter.py`:

```python
"voice_settings": {
    "stability": 0.5,        # 0.0-1.0 (lower = more expressive)
    "similarity_boost": 0.75 # 0.0-1.0 (higher = more similar to original)
}
```

### Model Selection

Available models:
- `eleven_multilingual_v2` (recommended, 29 languages)
- `eleven_monolingual_v1` (English only, classic)

Set in adapter initialization or environment variable.

---

## API Limits

| Plan | Characters/Month | Requests/Minute |
|------|-----------------|----------------|
| Free | 10,000 | 2 |
| Starter | 30,000 | 10 |
| Creator | 100,000 | 20 |
| Pro | 500,000 | 50 |

Check your usage: [ElevenLabs Dashboard](https://elevenlabs.io/usage)

---

## Integration Notes

### Output Format
- **Audio**: MP3, 48kHz stereo (standardized for FFmpeg)
- **Subtitles**: ASS format with brand color highlights
- **Duration**: Automatically detected via ffprobe

### Compatibility
- Fully compatible with existing pipeline
- Same interface as OpenAI TTS and Edge TTS
- Drop-in replacement, no code changes needed

### Subtitle Generation
- Text automatically chunked (~40 chars per line)
- Highlight words colored with brand orange (`#ea7e66`)
- Duration distributed proportionally to text length

---

## Support

- **ElevenLabs Docs**: https://docs.elevenlabs.io/
- **Community Discord**: https://discord.gg/elevenlabs
- **API Status**: https://status.elevenlabs.io/
