"""
Unit tests for MusicAdapter.

Run with: python -m pytest tests/test_music_adapter.py -v
"""
import os
import tempfile
import shutil
from pathlib import Path
import pytest
from src.adapters.music_adapter import MusicAdapter


class TestMusicAdapter:
    """Test suite for MusicAdapter."""

    def setup_method(self):
        """Create temporary music directory for testing."""
        self.temp_dir = tempfile.mkdtemp()
        self.music_dir = Path(self.temp_dir) / "music"
        self.adapter = MusicAdapter(str(self.music_dir))

    def teardown_method(self):
        """Clean up temporary directory."""
        if os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)

    def test_directory_creation(self):
        """Test that music directory is created if it doesn't exist."""
        assert self.music_dir.exists()
        assert self.music_dir.is_dir()

    def test_get_music_track_success(self):
        """Test successful music track retrieval."""
        # Create test music file
        mood_dir = self.music_dir / "ambient_cinematic"
        mood_dir.mkdir(parents=True)
        test_track = mood_dir / "test_track.mp3"
        test_track.write_text("fake mp3 content")

        # Get track
        track = self.adapter.get_music_track("ambient_cinematic", min_duration=60.0)

        assert track.exists()
        assert track.name == "test_track.mp3"
        assert track.parent.name == "ambient_cinematic"

    def test_get_music_track_no_mood_directory(self):
        """Test error when mood directory doesn't exist."""
        with pytest.raises(FileNotFoundError, match="No music directory found"):
            self.adapter.get_music_track("nonexistent_mood", min_duration=60.0)

    def test_get_music_track_empty_mood_directory(self):
        """Test error when mood directory has no music files."""
        mood_dir = self.music_dir / "empty_mood"
        mood_dir.mkdir(parents=True)

        with pytest.raises(FileNotFoundError, match="No music tracks found"):
            self.adapter.get_music_track("empty_mood", min_duration=60.0)

    def test_supported_audio_formats(self):
        """Test that all supported audio formats are recognized."""
        mood_dir = self.music_dir / "test_mood"
        mood_dir.mkdir(parents=True)

        formats = ['.mp3', '.wav', '.m4a', '.aac', '.ogg']
        for ext in formats:
            track = mood_dir / f"track{ext}"
            track.write_text("fake audio")

        track = self.adapter.get_music_track("test_mood", min_duration=60.0)
        assert track.suffix.lower() in formats

    def test_list_available_moods(self):
        """Test listing all available moods."""
        # Create multiple mood directories
        moods = ["ambient_cinematic", "upbeat", "dramatic"]
        for mood in moods:
            (self.music_dir / mood).mkdir(parents=True)

        available_moods = self.adapter.list_available_moods()
        assert set(available_moods) == set(moods)

    def test_list_available_moods_empty(self):
        """Test listing moods when none exist."""
        # Remove the created directory
        if self.music_dir.exists():
            shutil.rmtree(self.music_dir)

        available_moods = self.adapter.list_available_moods()
        assert available_moods == []

    def test_get_tracks_for_mood(self):
        """Test getting all tracks for a specific mood."""
        mood_dir = self.music_dir / "ambient_cinematic"
        mood_dir.mkdir(parents=True)

        # Create multiple tracks
        tracks = ["track1.mp3", "track2.mp3", "track3.wav"]
        for track_name in tracks:
            (mood_dir / track_name).write_text("fake audio")

        mood_tracks = self.adapter.get_tracks_for_mood("ambient_cinematic")
        assert len(mood_tracks) == 3
        assert all(t.exists() for t in mood_tracks)

    def test_get_tracks_for_nonexistent_mood(self):
        """Test getting tracks for non-existent mood returns empty list."""
        tracks = self.adapter.get_tracks_for_mood("nonexistent")
        assert tracks == []

    def test_ignores_hidden_directories(self):
        """Test that hidden directories (starting with .) are ignored."""
        (self.music_dir / ".hidden_mood").mkdir(parents=True)
        (self.music_dir / "visible_mood").mkdir(parents=True)

        moods = self.adapter.list_available_moods()
        assert ".hidden_mood" not in moods
        assert "visible_mood" in moods

    def test_ignores_non_audio_files(self):
        """Test that non-audio files are ignored."""
        mood_dir = self.music_dir / "test_mood"
        mood_dir.mkdir(parents=True)

        # Create audio and non-audio files
        (mood_dir / "track.mp3").write_text("audio")
        (mood_dir / "readme.txt").write_text("text")
        (mood_dir / "image.jpg").write_text("image")

        tracks = self.adapter.get_tracks_for_mood("test_mood")
        assert len(tracks) == 1
        assert tracks[0].name == "track.mp3"


if __name__ == "__main__":
    # Run tests if executed directly
    pytest.main([__file__, "-v"])
