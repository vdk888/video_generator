---
name: run_video_generator
description: Generates a video from a text script using a python based pipeline (Edge-TTS, Pexels, FFmpeg). Supports automated script generation via LLM.
---

# Run Video Generator (The Engine)

This skill generates educational videos adhering to the **Bubble Brand Identity**.
It now features an **Automated Engine** that transforms raw text into a dynamic video script.

## Prerequisites
- **Project Location**: `/Users/joris/Documents/video_generator`.
- **Virtual Env**: `venv` exists.
- **Environment (`.env`)**:
  ```bash
  PEXELS_API_KEY=...
  OPENROUTER_API_KEY=...
  OPENROUTER_MODEL=gpt-4o-mini
  ```

## Workflow: The "Engine" Automation

Instead of manually editing JSON, you now feed the **Raw Text** (e.g., from Notion) to the engine.

1.  **Prepare Input**:
    Paste your article/script content into `raw_source.txt` in the project root.

2.  **Run the Engine**:
    ```bash
    cd /Users/joris/Documents/video_generator
    venv/bin/python main.py
    ```

3.  **What Happens Automatically**:
    - **Appears**: The `OpenRouterAdapter` reads `raw_source.txt`.
    - **Segments**: Breaks long paragraphs into rhythmic, short lines (1-4s).
    - **Imagines**: Replaces generic concepts ("AI") with specific visual queries ("glowing blue neural network").
    - **Highlights**: Selects the punchiest keyword for Violet highlighting.
    - **Generates**: Produces `script.json` automatically.
    - **Renders**: Downloads media, generates speech (ASS subtitles), and compiles the video.

4.  **Output**:
    Final video at `/Users/joris/Documents/video_generator/final_output.mp4`.

## Manual Mode (Legacy)
If you want to manually edit the script:
1.  Delete or rename `raw_source.txt`.
2.  Edit `script.json` manually (see format below).
3.  Run `venv/bin/python main.py`.

### Script Format (`script.json`)
```json
{
  "type": "speech",
  "text": "Spoken narration.",
  "search_query": "cinematic visual description",
  "highlight_word": "keyword"
}
```
*   `highlight_word`: Trigger for **Bubble Violet** (`#667eea`) glow.

## Technical Details
- **Subtitles**: ASS Format (Inter Font, White Text, Black Outline).
- **Outro**: Resized logo (350px) on White Background.
- **Audio Service**: Edge-TTS (Vivienne Voice).
