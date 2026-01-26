from abc import ABC, abstractmethod
from typing import List, Optional
from pathlib import Path
from src.domain.models import AudioAsset, VideoAsset, Scene

class TTSProvider(ABC):
    @abstractmethod
    async def generate_audio(self, text: str, output_path: str, highlight_word: Optional[str] = None) -> AudioAsset:
        pass

class MediaProvider(ABC):
    @abstractmethod
    def search_video(self, query: str, output_path: str, min_duration: float) -> VideoAsset:
        pass

class MusicService(ABC):
    @abstractmethod
    def get_music_track(self, mood: str, min_duration: float) -> Path:
        """
        Retrieve background music track for given mood and minimum duration.

        Args:
            mood: Music mood (e.g., "ambient", "cinematic", "upbeat")
            min_duration: Minimum duration in seconds (music will be looped if shorter)

        Returns:
            Path to the music file
        """
        pass

class Renderer(ABC):
    @abstractmethod
    def render_scene(self, scene: Scene) -> str:
        """Render a single scene and return the path to the output video fragment."""
        pass

    @abstractmethod
    def concat_scenes(self, scene_files: List[str], output_file: str, transition_duration: float = 0.4, music_path: Optional[str] = None) -> None:
        """Concatenate multiple video fragments into a single file with transitions and optional background music.

        Args:
            scene_files: List of video file paths to concatenate
            output_file: Path to output concatenated video
            transition_duration: Duration of fade transitions between scenes (default: 0.4s)
            music_path: Optional path to background music (will be mixed at -20dB with fades)
        """
        pass

    @abstractmethod
    def normalize_video(self, input_path: str, output_path: str) -> str:
        """Convert a video to the standard format (1920x1080, 25fps) for concatenation."""
        pass

    @abstractmethod
    def render_title_card(self, text: str, output_path: str, duration: float = 3.0) -> str:
        """Render a static or animated title card."""
        pass

    @abstractmethod
    def render_logo_outro(self, input_path: str, output_path: str) -> str:
        """Render the outro logo resized on a branded background."""
        pass

class ScriptGenerator(ABC):
    @abstractmethod
    async def generate_script(self, raw_text: str) -> List[dict]:
        """
        Takes raw text and returns a list of script lines (dictionaries).
        Enrichment:
        1. Segmentation (Rhythm)
        2. Visual Queries (Imagination)
        3. Highlights (Engagement)
        """
        pass

class AvatarProvider(ABC):
    @abstractmethod
    async def generate_avatar_video(
        self,
        text: str,
        avatar_id: str,
        voice_id: str,
        output_path: Path
    ) -> Path:
        """
        Generate avatar video from text using AI avatar service.

        Args:
            text: The script text for the avatar to speak
            avatar_id: ID of the avatar to use
            voice_id: ID of the voice to use
            output_path: Path where the final normalized video should be saved

        Returns:
            Path to the normalized avatar video (1920x1080@25fps yuv420p)
        """
        pass
