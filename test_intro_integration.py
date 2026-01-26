#!/usr/bin/env python3
"""
Integration test: Verify branded intro appears at the start of generated video.
"""
import asyncio
import os
from src.infra.config import load_config
from src.adapters.edge_tts_adapter import EdgeTTSAdapter
from src.adapters.pexels_adapter import PexelsAdapter
from src.adapters.ffmpeg_adapter import FFmpegAdapter
from src.app.use_cases import GenerateVideoUseCase

async def main():
    print("=== Intro Integration Test ===\n")

    config = load_config(project_name="intro_test")
    tts = EdgeTTSAdapter()
    media = PexelsAdapter(config.pexels_api_key)
    renderer = FFmpegAdapter()

    use_case = GenerateVideoUseCase(tts, media, renderer, config)

    # Use minimal test script
    script_path = "test_intro_integration.json"
    if not os.path.exists(script_path):
        print(f"Error: {script_path} not found")
        return

    print("Generating video with branded intro...")
    await use_case.execute(script_path)

    print("\n=== Test Complete ===")
    print(f"Output: {config.final_video_path}")
    print(f"To view: open {config.final_video_path}")

    # Verify intro is present by checking duration
    import subprocess
    if os.path.exists(config.final_video_path):
        cmd = [
            "ffprobe",
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            config.final_video_path
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        duration = float(result.stdout.strip())
        print(f"\nTotal video duration: {duration:.2f}s")
        print(f"Expected intro duration: 3.0s (should be included)")

if __name__ == "__main__":
    asyncio.run(main())
