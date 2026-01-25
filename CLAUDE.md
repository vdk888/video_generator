# CLAUDE.md

## Project: Bubble Video Engine
A Python-based automated video generation pipeline using Clean Architecture.

## Commands
- **Run Engine**: `venv/bin/python main.py` (Reads `raw_source.txt` or `script.json`)
- **Run Tests**: `venv/bin/python test_override.py` (Isolated custom media test)
- **Install**: `pip install -r requirements.txt`
- **Clean Assets**: `rm assets/scene_*.mp4 assets/audio_*.mp3 assets/video_raw_*.mp4` (Recommended before full runs)
- **Kill Process**: `pkill -f ffmpeg` (If stuck)

## Architecture
- **Pattern**: Clean Architecture (Hexagonal).
- **Core**: `src/app/use_cases.py` controls the flow.
- **Interfaces**: Defined in `src/ports/interfaces.py`.
- **Adapters**:
    - `FFmpegAdapter`: Handles all rendering. **CRITICAL**: Use `-pix_fmt yuv420p` for compatibility.
    - `OpenRouterAdapter`: Handles LLM script enrichment.
    - `PexelsAdapter`: Fetches stock footage.

## Code Style
- **Type Hints**: Mandatory for all function signatures.
- **Async/Await**: Used heavily for IO-bound tasks (TTS, LLM).
- **Imports**: Absolute imports from `src...`.

## Key "Gotchas"
- **Static Images**: When using `custom_media_path` with images (`.png`, `.jpg`), `FFmpegAdapter` uses `-loop 1` instead of `-stream_loop -1`.
- **Kinetic Typography**: Implemented via `FFmpegAdapter`. Applies `eq=brightness=-0.4` to background and overlays massive centered text.
- **Script Generation**: `ScriptGenerator` (OpenRouter) is skipped if `script.json` already exists (Director Mode). Delete `script.json` to force regeneration from `raw_source.txt`.
