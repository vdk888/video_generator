#!/usr/bin/env python3
"""
Test script for branded intro rendering.
Tests both logo-based intro (if logo exists) and text-only fallback.
"""
import os
from src.adapters.ffmpeg_adapter import FFmpegAdapter

def test_intro():
    print("=== Testing Branded Intro ===\n")

    renderer = FFmpegAdapter()

    # Test 1: Text-only intro (no logo)
    print("Test 1: Text-only intro (fallback mode)")
    output_path_text = "test_intro_text.mp4"

    if os.path.exists(output_path_text):
        os.remove(output_path_text)

    try:
        renderer.render_branded_intro(output_path_text, duration=3.0, logo_path="nonexistent.png")
        if os.path.exists(output_path_text):
            size = os.path.getsize(output_path_text)
            print(f"✓ Text intro created: {output_path_text} ({size} bytes)")
        else:
            print("✗ Text intro file not created")
    except Exception as e:
        print(f"✗ Text intro failed: {e}")

    print()

    # Test 2: Logo-based intro (if logo exists)
    print("Test 2: Logo-based intro")
    logo_path = "assets/logo.png"
    output_path_logo = "test_intro_logo.mp4"

    if os.path.exists(output_path_logo):
        os.remove(output_path_logo)

    if os.path.exists(logo_path):
        try:
            renderer.render_branded_intro(output_path_logo, duration=3.0, logo_path=logo_path)
            if os.path.exists(output_path_logo):
                size = os.path.getsize(output_path_logo)
                print(f"✓ Logo intro created: {output_path_logo} ({size} bytes)")
            else:
                print("✗ Logo intro file not created")
        except Exception as e:
            print(f"✗ Logo intro failed: {e}")
    else:
        print(f"⊘ Logo not found at {logo_path}, skipping logo test")

    print()

    # Test 3: Check video properties with ffprobe
    print("Test 3: Verify video properties")
    for test_file in [output_path_text, output_path_logo]:
        if os.path.exists(test_file):
            import subprocess
            try:
                cmd = [
                    "ffprobe",
                    "-v", "error",
                    "-select_streams", "v:0",
                    "-show_entries", "stream=width,height,pix_fmt,duration,r_frame_rate",
                    "-of", "default=noprint_wrappers=1",
                    test_file
                ]
                result = subprocess.run(cmd, capture_output=True, text=True, check=True)
                print(f"\n{test_file} properties:")
                print(result.stdout)
            except Exception as e:
                print(f"Could not probe {test_file}: {e}")

    print("\n=== Test Complete ===")
    print("\nTo view test videos:")
    if os.path.exists(output_path_text):
        print(f"  open {output_path_text}")
    if os.path.exists(output_path_logo):
        print(f"  open {output_path_logo}")

if __name__ == "__main__":
    test_intro()
