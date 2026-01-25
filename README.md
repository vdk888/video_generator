# Bubble Video Engine

An automated, "Clean Architecture" python pipeline that turns raw text into high-quality, branded educational videos. It leverages LLMs for scriptwriting, Pexels for stock footage, EdgeTTS for narration, and FFmpeg for cinematic rendering.

## Features

-   **🧠 Automated "Brain"**: Uses `gpt-4o-mini` (via OpenRouter) to transform articles into rhythmic video scripts.
-   **🎨 Cinematic Visuals**: Automatically fetches matching B-roll from Pexels using "Visual Imagination" queries.
-   **💥 Kinetic Typography**: Highlights dramatic keywords with massive, centered, violet text overlays (Brand Identity).
-   **🔧 Custom Control**: "Director Mode" allows enforcing specific manual images or videos in the timeline.
-   **🔊 Pro Audio**: High-quality TTS (Voice: Vivienne) mixed with background tracks.
-   **⚡ Branded**: Automated Intro/Outro logic, standard fonts (Inter), and colors.

## Installation

1.  **Clone & Setup**:
    ```bash
    git clone <repo>
    cd video_generator
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    ```

2.  **Environment Configuration**:
    Create a `.env` file in the root directory:
    ```bash
    PEXELS_API_KEY=your_pexel_key
    OPENROUTER_API_KEY=your_openrouter_key
    OPENROUTER_MODEL=gpt-4o-mini
    ```

3.  **Assets**:
    Ensure the `assets/` folder contains fonts (`Inter-ExtraBold.ttf`) and outro/intro media files.

## Usage

### 🚀 Auto Mode (Text -> Video)
The fastest way to generate content.

1.  Paste your article or script into `raw_source.txt` in the project root.
2.  Run the engine:
    ```bash
    venv/bin/python main.py
    ```
3.  The pipeline will:
    -   Generate `script.json`.
    -   Download assets.
    -   Render `final_output.mp4`.

### 🎬 Director Mode (Manual Edits)
For precise control over specific scenes.

1.  Generate a draft (or create `script.json` manually).
2.  Edit `script.json` to inject custom media:
    ```json
    {
      "text": "And this is our custom chart.",
      "custom_media_path": "/absolute/path/to/chart.png",
      "highlight_word": "Growth"
    }
    ```
    *Note: Static images are automatically looped as video clips.*
3.  Re-run `venv/bin/python main.py`.

## Architecture

The project follows **Clean Architecture** principles:

-   `src/domain`: Core models (`ScriptLine`, `Scene`, `VideoAsset`).
-   `src/ports`: Abstract interfaces for dependencies (`MediaProvider`, `Renderer`).
-   `src/adapters`: Concrete implementations (`PexelsAdapter`, `FFmpegAdapter`, `OpenRouterAdapter`).
-   `src/app`: Business logic (`GenerateVideoUseCase`).

## Troubleshooting

-   **Frozen Images**: Ensure your FFmpeg build supports standard H.264. The engine forces `yuv420p` for max compatibility.
-   **Stuck Process**: If the script hangs for >5 mins, run `pkill -f ffmpeg` to kill zombie workers.
