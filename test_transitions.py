"""
Test script to verify transition system implementation.
Creates test video scenes and verifies xfade transitions work.
"""
import subprocess
import os
import tempfile
from src.adapters.ffmpeg_adapter import FFmpegAdapter

def create_test_video(output_path: str, duration: float, color: str) -> None:
    """Create a simple test video with colored background."""
    cmd = [
        "ffmpeg", "-y",
        "-f", "lavfi", "-i", f"color=c={color}:s=1920x1080:d={duration}:r=25",
        "-f", "lavfi", "-i", f"anullsrc=r=48000:cl=stereo:d={duration}",
        "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-ar", "48000", "-ac", "2",
        output_path
    ]
    try:
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
        print(f"Created test video: {output_path} ({color}, {duration}s)")
    except subprocess.CalledProcessError as e:
        print(f"FFmpeg error: {e.stderr}")
        raise

def test_two_scenes():
    """Test concatenation with 2 scenes."""
    print("\n=== TEST 1: Two Scenes ===")
    with tempfile.TemporaryDirectory() as tmpdir:
        scene1 = os.path.join(tmpdir, "scene1.mp4")
        scene2 = os.path.join(tmpdir, "scene2.mp4")
        output = os.path.join(tmpdir, "output_2scenes.mp4")

        # Create test scenes
        create_test_video(scene1, 3.0, "red")
        create_test_video(scene2, 3.0, "blue")

        # Test concatenation with transitions
        renderer = FFmpegAdapter()
        try:
            renderer.concat_scenes([scene1, scene2], output, transition_duration=0.4)

            # Verify output exists and has reasonable duration
            if os.path.exists(output):
                # Expected duration: 3 + 3 - 0.4 = 5.6s
                cmd = ["ffprobe", "-v", "error", "-show_entries", "format=duration",
                       "-of", "default=noprint_wrappers=1:nokey=1", output]
                result = subprocess.run(cmd, capture_output=True, text=True, check=True)
                duration = float(result.stdout.strip())
                expected = 5.6
                if abs(duration - expected) < 0.5:
                    print(f"✓ Two scenes test PASSED (duration: {duration:.2f}s, expected: {expected:.2f}s)")
                    return True
                else:
                    print(f"✗ Two scenes test FAILED (duration: {duration:.2f}s, expected: {expected:.2f}s)")
                    return False
        except Exception as e:
            print(f"✗ Two scenes test FAILED with error: {e}")
            return False

def test_three_scenes():
    """Test concatenation with 3 scenes."""
    print("\n=== TEST 2: Three Scenes ===")
    with tempfile.TemporaryDirectory() as tmpdir:
        scene1 = os.path.join(tmpdir, "scene1.mp4")
        scene2 = os.path.join(tmpdir, "scene2.mp4")
        scene3 = os.path.join(tmpdir, "scene3.mp4")
        output = os.path.join(tmpdir, "output_3scenes.mp4")

        # Create test scenes
        create_test_video(scene1, 4.0, "red")
        create_test_video(scene2, 3.0, "green")
        create_test_video(scene3, 5.0, "blue")

        # Test concatenation with transitions
        renderer = FFmpegAdapter()
        try:
            renderer.concat_scenes([scene1, scene2, scene3], output, transition_duration=0.4)

            # Verify output exists and has reasonable duration
            if os.path.exists(output):
                # Expected duration: 4 + 3 + 5 - 2*0.4 = 11.2s
                cmd = ["ffprobe", "-v", "error", "-show_entries", "format=duration",
                       "-of", "default=noprint_wrappers=1:nokey=1", output]
                result = subprocess.run(cmd, capture_output=True, text=True, check=True)
                duration = float(result.stdout.strip())
                expected = 11.2
                if abs(duration - expected) < 0.5:
                    print(f"✓ Three scenes test PASSED (duration: {duration:.2f}s, expected: {expected:.2f}s)")
                    return True
                else:
                    print(f"✗ Three scenes test FAILED (duration: {duration:.2f}s, expected: {expected:.2f}s)")
                    return False
        except Exception as e:
            print(f"✗ Three scenes test FAILED with error: {e}")
            return False

def test_single_scene():
    """Test concatenation with single scene (should skip transitions)."""
    print("\n=== TEST 3: Single Scene ===")
    with tempfile.TemporaryDirectory() as tmpdir:
        scene1 = os.path.join(tmpdir, "scene1.mp4")
        output = os.path.join(tmpdir, "output_1scene.mp4")

        # Create test scene
        create_test_video(scene1, 3.0, "purple")

        # Test concatenation
        renderer = FFmpegAdapter()
        try:
            renderer.concat_scenes([scene1], output, transition_duration=0.4)

            if os.path.exists(output):
                cmd = ["ffprobe", "-v", "error", "-show_entries", "format=duration",
                       "-of", "default=noprint_wrappers=1:nokey=1", output]
                result = subprocess.run(cmd, capture_output=True, text=True, check=True)
                duration = float(result.stdout.strip())
                expected = 3.0
                if abs(duration - expected) < 0.5:
                    print(f"✓ Single scene test PASSED (duration: {duration:.2f}s, expected: {expected:.2f}s)")
                    return True
                else:
                    print(f"✗ Single scene test FAILED (duration: {duration:.2f}s, expected: {expected:.2f}s)")
                    return False
        except Exception as e:
            print(f"✗ Single scene test FAILED with error: {e}")
            return False

if __name__ == "__main__":
    print("Testing Transition System Implementation")
    print("=" * 50)

    results = []
    results.append(("Single Scene", test_single_scene()))
    results.append(("Two Scenes", test_two_scenes()))
    results.append(("Three Scenes", test_three_scenes()))

    print("\n" + "=" * 50)
    print("SUMMARY:")
    for name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"  {status}: {name}")

    all_passed = all(result for _, result in results)
    if all_passed:
        print("\n✓ All tests passed!")
    else:
        print("\n✗ Some tests failed")

    exit(0 if all_passed else 1)
