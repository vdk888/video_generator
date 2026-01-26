#!/usr/bin/env python3
"""
Test script for ElevenLabs TTS Adapter.

Usage:
    python test_elevenlabs.py

Environment variables required:
    ELEVENLABS_API_KEY - Your ElevenLabs API key
"""

import asyncio
import os
from dotenv import load_dotenv
from src.adapters.elevenlabs_adapter import ElevenLabsAdapter

async def test_elevenlabs():
    # Load environment
    load_dotenv()

    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        print("ERROR: ELEVENLABS_API_KEY not found in environment")
        print("Please add it to your .env file")
        return

    # Test text (French)
    test_text = "Bonjour! Ceci est un test de la voix ElevenLabs. La qualité est excellente."

    # Output path
    output_dir = "test_output"
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "test_elevenlabs.mp3")

    # Initialize adapter with Bella voice (French female)
    adapter = ElevenLabsAdapter(
        api_key=api_key,
        voice_id="EXAVITQu4vr4xnSDxMaL",  # Bella
        model_id="eleven_multilingual_v2"
    )

    print("Testing ElevenLabs TTS...")
    print(f"Text: {test_text}")
    print(f"Output: {output_path}")

    try:
        # Generate audio
        audio_asset = await adapter.generate_audio(
            text=test_text,
            output_path=output_path,
            highlight_word="excellente"
        )

        print("\nSUCCESS!")
        print(f"Audio file: {audio_asset.file_path}")
        print(f"Duration: {audio_asset.duration:.2f}s")
        print(f"Subtitle file: {audio_asset.subtitle_path}")

        # Verify files exist
        if os.path.exists(audio_asset.file_path):
            file_size = os.path.getsize(audio_asset.file_path)
            print(f"Audio file size: {file_size / 1024:.1f} KB")
        else:
            print("WARNING: Audio file not found!")

        if os.path.exists(audio_asset.subtitle_path):
            print(f"Subtitle file exists: {audio_asset.subtitle_path}")
        else:
            print("WARNING: Subtitle file not found!")

    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_elevenlabs())
