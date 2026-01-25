from abc import ABC, abstractmethod
from typing import List
from src.domain.models import AudioAsset, VideoAsset, Scene

class TTSProvider(ABC):
    @abstractmethod
    async def generate_audio(self, text: str, output_path: str) -> AudioAsset:
        pass

class MediaProvider(ABC):
    @abstractmethod
    def search_video(self, query: str, output_path: str, min_duration: float) -> VideoAsset:
        pass

class Renderer(ABC):
    @abstractmethod
    def render_scene(self, scene: Scene) -> str:
        """Render a single scene and return the path to the output video fragment."""
        pass

    @abstractmethod
    def concat_scenes(self, scene_files: List[str], output_file: str) -> None:
        """Concatenate multiple video fragments into a single file."""
        pass

    @abstractmethod
    def normalize_video(self, input_path: str, output_path: str) -> str:
        """Convert a video to the standard format (1920x1080, 25fps) for concatenation."""
        pass

    @abstractmethod
    def render_title_card(self, text: str, output_path: str, duration: float = 3.0) -> str:
        """Render a static or animated title card."""
        pass
