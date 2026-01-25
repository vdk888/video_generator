---
name: run_video_generator
description: Generates a video from a text script using a python based pipeline (Edge-TTS, Pexels, FFmpeg). Use this when the user wants to create a new video or update the existing one.
---

# Run Video Generator

This skill allows you to generate a video based on a JSON script, adhering to the **Bubble Brand Identity**.

## Prerequisites
- The project is located at `/Users/joris/Documents/video_generator`.
- A virtual environment `venv` exists in that directory.
- **Charte Graphique**: Refer to `Charte Graphique Bubble....md` in the project root for design decisions.

## Script Format (`script.json`)
The script supports **Speech** (narration + stock video) and **Titles** (black text on white background transitions).

```json
[
  {
    "type": "title",
    "text": "PARTIE 1 : L'EVEIL"
  },
  {
    "type": "speech",
    "text": "Spoken narration here...",
    "search_query": "visual search keywords"
  }
]
```
*Note*: `type` defaults to `"speech"` if omitted.

## Brand Identity Guidelines ("Bubble")
- **Colors**: White Background, Black Text.
- **Font**: Clean Sans-Serif (Arial/Helvetica/Inter).
- **Audio Standards**: All outputs MUST be `AAC`, `48kHz`, `Stereo` to ensure seamless concatenation.
- **Outro**: The file `vidu-video-....mov` is automatically normalized and appended as the **closing** logo animation.

## Usage

1.  **Update Script (Optional)**:
    Modify `script.json` following the format above.

2.  **Run Generation**:
    Execute the main python script using the virtual environment.
    ```bash
    cd /Users/joris/Documents/video_generator
    venv/bin/python main.py
    ```

3.  **Output**:
    The final video will be at `/Users/joris/Documents/video_generator/final_output.mp4`.

## Troubleshooting
- **Audio Loss**: If parts of the video are silent, ensure `FFmpegAdapter` filters enforce `-c:a aac -ar 48000 -ac 2`.
- **FFmpeg Text Escaping**: If title rendering fails, check that `render_title_card` uses the `textfile` method to handle special characters safely.
- **Permissions**: `chmod +x bin/ffmpeg` if the local binary is denied.
