"""
Manual test for MusicAdapter functionality.
"""
import os
import tempfile
import shutil
from pathlib import Path
from src.adapters.music_adapter import MusicAdapter


def test_music_adapter():
    """Simple manual test for MusicAdapter."""
    # Create temporary directory
    temp_dir = tempfile.mkdtemp()
    music_dir = Path(temp_dir) / "music"

    try:
        print("1. Testing directory creation...")
        adapter = MusicAdapter(str(music_dir))
        assert music_dir.exists(), "Music directory not created"
        print("   ✓ Directory created successfully")

        print("\n2. Testing track selection...")
        # Create test music file
        mood_dir = music_dir / "ambient_cinematic"
        mood_dir.mkdir(parents=True)
        test_track = mood_dir / "test_track.mp3"
        test_track.write_text("fake mp3 content")

        track = adapter.get_music_track("ambient_cinematic", min_duration=60.0)
        assert track.exists(), "Track not found"
        assert track.name == "test_track.mp3", f"Wrong track: {track.name}"
        print(f"   ✓ Track selected: {track.name}")

        print("\n3. Testing multiple tracks...")
        (mood_dir / "track2.mp3").write_text("fake mp3")
        (mood_dir / "track3.wav").write_text("fake wav")
        tracks = adapter.get_tracks_for_mood("ambient_cinematic")
        assert len(tracks) == 3, f"Expected 3 tracks, got {len(tracks)}"
        print(f"   ✓ Found {len(tracks)} tracks")

        print("\n4. Testing mood listing...")
        (music_dir / "upbeat").mkdir(parents=True)
        (music_dir / "dramatic").mkdir(parents=True)
        moods = adapter.list_available_moods()
        assert "ambient_cinematic" in moods
        assert "upbeat" in moods
        print(f"   ✓ Available moods: {', '.join(moods)}")

        print("\n5. Testing error handling...")
        try:
            adapter.get_music_track("nonexistent_mood", 60.0)
            assert False, "Should have raised FileNotFoundError"
        except FileNotFoundError as e:
            print(f"   ✓ Correctly raised error: {str(e)[:60]}...")

        print("\n✅ All tests passed!")

    finally:
        # Cleanup
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)
        print(f"\n🧹 Cleaned up test directory")


if __name__ == "__main__":
    test_music_adapter()
