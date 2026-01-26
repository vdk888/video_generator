"""
Test script for HeyGen Avatar Adapter

This demonstrates:
1. Avatar scene generation
2. Mixed broll and avatar scenes
3. Integration with the video pipeline
"""

import asyncio
import os
from pathlib import Path
from src.adapters.heygen_adapter import HeyGenAdapter


async def test_avatar_generation():
    """Test basic avatar video generation."""
    print("=" * 60)
    print("Testing HeyGen Avatar Adapter")
    print("=" * 60)

    # Check for API key
    api_key = os.getenv("HEYGEN_API_KEY")
    if not api_key:
        print("ERROR: HEYGEN_API_KEY not found in environment")
        print("Please add it to your .env file:")
        print("  HEYGEN_API_KEY=your_key_here")
        return

    # Initialize adapter
    adapter = HeyGenAdapter(api_key)

    # Test parameters
    test_text = "Welcome to Bubble! This is a test of AI avatar video generation."
    avatar_id = "Angela-inblackskirt-20220820"  # Default HeyGen avatar
    voice_id = "1bd001e7e50f421d891986aad5158bc8"  # Default voice
    output_path = Path("test_avatar_output.mp4")

    print(f"\nGenerating avatar video...")
    print(f"Text: {test_text}")
    print(f"Avatar: {avatar_id}")
    print(f"Voice: {voice_id}")

    try:
        # Generate avatar video
        result_path = await adapter.generate_avatar_video(
            text=test_text,
            avatar_id=avatar_id,
            voice_id=voice_id,
            output_path=output_path
        )

        print(f"\n✓ Success! Video saved to: {result_path}")
        print(f"✓ File size: {result_path.stat().st_size / 1024 / 1024:.2f} MB")

        # Verify video properties
        import subprocess
        probe_cmd = [
            "ffprobe",
            "-v", "error",
            "-select_streams", "v:0",
            "-show_entries", "stream=width,height,r_frame_rate,pix_fmt,codec_name",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1",
            str(result_path)
        ]

        probe_result = subprocess.run(probe_cmd, capture_output=True, text=True)
        print("\nVideo Properties:")
        print(probe_result.stdout)

    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()


def create_mixed_script_example():
    """Create an example script.json with mixed scene types."""
    import json

    script = [
        {
            "text": "Welcome to this tutorial on AI video generation.",
            "type": "speech",
            "scene_type": "avatar"
        },
        {
            "text": "First, let's explore the technology behind it.",
            "search_query": "artificial intelligence technology",
            "type": "speech",
            "scene_type": "broll"
        },
        {
            "text": "Key Features",
            "type": "title",
            "scene_type": "title"
        },
        {
            "text": "AI avatars can speak any text with natural expressions.",
            "type": "speech",
            "scene_type": "avatar"
        },
        {
            "text": "This opens up amazing possibilities for content creation.",
            "search_query": "creative content production",
            "type": "speech",
            "scene_type": "broll"
        }
    ]

    # Save to projects/avatar_test/script.json
    project_dir = Path("projects/avatar_test")
    project_dir.mkdir(parents=True, exist_ok=True)

    script_path = project_dir / "script.json"
    with open(script_path, "w") as f:
        json.dump(script, f, indent=2)

    print(f"\n✓ Example script created: {script_path}")
    print("\nTo run the full pipeline with this script:")
    print(f"  venv/bin/python main.py --project avatar_test")


if __name__ == "__main__":
    import sys

    print("\nHeyGen Avatar Adapter Test\n")
    print("Options:")
    print("  1. Test avatar generation (requires HEYGEN_API_KEY)")
    print("  2. Create example mixed script")
    print()

    choice = input("Enter choice (1 or 2): ").strip()

    if choice == "1":
        asyncio.run(test_avatar_generation())
    elif choice == "2":
        create_mixed_script_example()
    else:
        print("Invalid choice")
