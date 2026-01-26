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
    -   **Generates**: Produces `script.json` automatically using the **Bubble Persona**.
    -   **Renders**: Downloads media, generates speech (ASS subtitles), and compiles the video.

4.  **Output**:
    Final video at `/Users/joris/Documents/video_generator/final_output.mp4`.

## The Bubble Tone (Writing Guidelines)
Whether you are editing manually or prompting an agent, follow these rules:

1.  **Analogy First**: Explain complex topics using everyday concepts (e.g., "The CPU is the brain, the RAM is the workbench").
2.  **Structure**: Break content into explicit parts ("Partie 1", "Partie 2").
3.  **Accessible Voice**:
    -   Address the viewer directly ("Vous").
    -   Use hooks: "Spoiler: it's simple," "Let's take 5 minutes."
    -   Be reassuring yet authoritative.
4.  **Visual Metaphors**: When choosing B-roll, match the *analogy*, not the literal tech term.

## Audio Engine (New)
The system now uses **OpenAI High-Quality TTS** (`gpt-audio-mini` / `tts-1-hd`) for native-sounding French narration.
-   **Requires**: `OPENAI_API_KEY` in `.env` (or valid OpenRouter Audio support).
-   **Cost**: extremely low (~$0.01/min), but much higher quality than EdgeTTS.
-   **Fallback**: If no key provided, it *could* fallback to robotic EdgeTTS (if configured), but OpenAI is default.

## Project Isolation
The system now supports project folders to keep assets organized.
-   **Structure**: `projects/<project_name>/`
    -   `script.json` (The script)
    -   `raw_source.txt` (Source text)
    -   `assets/` (Generated videos/audio)
    -   `final_output.mp4` (Result)
    -   (Optional) Custom media files
-   **Usage**: `venv/bin/python main.py --project <project_name>`
    -   Default: `python main.py` uses `projects/default`

## Robustness Features
1.  **Subtitle Segmentation**: Long sentences are automatically split into dynamic, bite-sized chunks for better readability.
2.  **Media Fallback**: If a `custom_media_path` in `script.json` is missing, the system **automatically falls back** to searching Pexels using the `search_query` or `text`.
3.  **Audio Recovery**: Uses OpenAI High-Quality Voice with automatic WAV conversion.

## Manual Mode (Director / Agentic)
If you want to manually write the script (or have the Agent do it without the LLM):

1.  **Create/Edit `projects/default/script.json` directly**.
    (If this file exists, the Engine skips the automated OpenRouter step).

2.  **Script Format**:

### Agentic Workflow
**User**: "Write a script about Quantum Computing using the Bubble Tone."
**Agent**:
1.  Read `SKILL.md` (this file) to understand the Tone.
2.  Draft the content following the "Analogy First" rule.
3.  Write the JSON directly to `script.json`.
4.  Run the engine.

## Technical Details
-   **Subtitles**: ASS Format (Inter Font).
- **Outro**: Branded logo on white, 350px width.

## Troubleshooting
- **Frozen Images**: Fixed by forcing `yuv420p` pixel format.
- **High CPU**: If `main.py` hangs, run `pkill -f ffmpeg` to clear zombie processes.
