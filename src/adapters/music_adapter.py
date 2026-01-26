import os
from pathlib import Path
from typing import List
from src.ports.interfaces import MusicService


class MusicAdapter(MusicService):
    """
    File-based music library adapter.

    Selects background music tracks from local directory organized by mood.
    Music files should be organized as: {music_dir}/{mood}/{track}.mp3

    Example structure:
        assets/music/
            ambient_cinematic/
                track1.mp3
                track2.mp3
            upbeat/
                track1.mp3
    """

    def __init__(self, music_dir: str):
        """
        Initialize music adapter.

        Args:
            music_dir: Base directory containing music files organized by mood
        """
        self.music_dir = Path(music_dir)
        self._ensure_directory_exists()

    def _ensure_directory_exists(self) -> None:
        """Create music directory structure if it doesn't exist."""
        if not self.music_dir.exists():
            self.music_dir.mkdir(parents=True, exist_ok=True)
            print(f"Created music directory: {self.music_dir}")

    def get_music_track(self, mood: str, min_duration: float) -> Path:
        """
        Retrieve background music track for given mood.

        Args:
            mood: Music mood (e.g., "ambient_cinematic", "upbeat")
            min_duration: Minimum duration in seconds (not used for file selection,
                         FFmpeg will loop the track if needed)

        Returns:
            Path to the music file

        Raises:
            FileNotFoundError: If no music tracks found for the mood
        """
        mood_dir = self.music_dir / mood

        if not mood_dir.exists():
            raise FileNotFoundError(
                f"No music directory found for mood '{mood}'. "
                f"Expected directory: {mood_dir}. "
                f"Please add music files to {mood_dir}/"
            )

        # Find all audio files in the mood directory
        audio_extensions = ['.mp3', '.wav', '.m4a', '.aac', '.ogg']
        tracks = [
            f for f in mood_dir.iterdir()
            if f.is_file() and f.suffix.lower() in audio_extensions
        ]

        if not tracks:
            raise FileNotFoundError(
                f"No music tracks found in {mood_dir}. "
                f"Please add audio files (.mp3, .wav, etc.) to this directory."
            )

        # For now, select the first track
        # Future enhancement: random selection, rotation, or mood-based selection
        selected_track = tracks[0]

        print(f"Selected music track: {selected_track.name} (mood: {mood})")
        return selected_track

    def list_available_moods(self) -> List[str]:
        """
        List all available music moods (subdirectories in music_dir).

        Returns:
            List of mood names
        """
        if not self.music_dir.exists():
            return []

        return [
            d.name for d in self.music_dir.iterdir()
            if d.is_dir() and not d.name.startswith('.')
        ]

    def get_tracks_for_mood(self, mood: str) -> List[Path]:
        """
        Get all available tracks for a specific mood.

        Args:
            mood: Music mood name

        Returns:
            List of track paths
        """
        mood_dir = self.music_dir / mood

        if not mood_dir.exists():
            return []

        audio_extensions = ['.mp3', '.wav', '.m4a', '.aac', '.ogg']
        return [
            f for f in mood_dir.iterdir()
            if f.is_file() and f.suffix.lower() in audio_extensions
        ]
