---
name: run_video_generator
description: Generates a video from a text script using a python based pipeline. Supports automated formatting (LLM), custom media injection, and kinetic typography.
---

# Video Engine (Bubble Brand)

This skill controls the **Video Generation Engine**, a system that transforms raw text or structured JSON into a high-quality, branded video.

## Capabilities

1.  **Automated Enrichment ("The Brain")**:
    - Takes raw text (e.g., Notion page).
    - Uses LLM (OpenRouter) to segment text into rhythmic clips.
    - Generates cinematic search queries for Pexels.
    - Identifies "Dramatic Moments" for highlighting.

2.  **Kinetic Typography**:
    - **Dramatic Highlights**: Keywords marked for emphasis appear **Huge (170px), Violet, and Centered** on screen.
    - **Visual Dynamics**: The background video dims automatically to make the text pop.

3.  **Media Injection (Overrides)**:
    - You can force-insert **Video** or **Images** (png/jpg) at any point.
    - Images are automatically converted to video loops.

## Usage Workflows

### 1. Automatic Generation (Text -> Video)
Use this when you have a script or article and want the engine to do everything.

1.  **Write/Paste** content into `raw_source.txt` (Project Root).
2.  **Run**: `venv/bin/python main.py`
3.  **Result**: `final_output.mp4`.

### 2. Manual/Custom Injection (The "Director" Mode)
Use this to modify a generated video or insert custom assets (logos, screenshots, specific clips).

1.  **Edit `script.json`**:
    Find the segment you want to change.
    
    *Example: Inserting an OpenAI Logo*
    ```json
    {
      "text": "OpenAI changed the world.",
      "custom_media_path": "/Users/joris/Downloads/openai_logo.png",
      "highlight_word": "OpenAI"
    }
    ```
    - `custom_media_path`: Absolute path to your file (Video or Image).
    - `highlight_word`: (Optional) Text to display in Kinetic Typography over the image.

2.  **Run**: `venv/bin/python main.py`
    (The engine detects `script.json` exists and skips the LLM generation to preserve your edits).

### 3. Agentic Workflow ("Talk to Me")
You (the Agent) can perform these edits for the user:
- **User**: "Add the OpenAI logo when it talks about GPT-3."
- **Agent Action**:
    1.  Locate the image (or download it).
    2.  Read `script.json`.
    3.  Find the segment discussing "GPT-3".
    4.  Update the JSON object with `custom_media_path`.
    5.  Run `venv/bin/python main.py`.

## Technical Specs
- **Resolution**: 1920x1080 (HD).
- **Audio**: AAC, 48kHz, Stereo (normalized).
- **Format**: `.mp4` (H.264, yuv420p for max compatibility).
- **Subtitles**: ASS format (Inter Font, Bottom).
- **Outro**: Branded logo on white, 350px width.

## Troubleshooting
- **Frozen Images**: Fixed by forcing `yuv420p` pixel format.
- **High CPU**: If `main.py` hangs, run `pkill -f ffmpeg` to clear zombie processes.
