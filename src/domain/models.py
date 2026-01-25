from dataclasses import dataclass
from typing import List, Optional

@dataclass
class ScriptLine:
    text: str
    search_query: str = ""
    type: str = "speech" # "speech" or "title"

@dataclass
class AudioAsset:
    file_path: str
    subtitle_path: Optional[str] = None
    duration: float = 0.0

@dataclass
class VideoAsset:
    file_path: str
    width: int = 0
    height: int = 0

@dataclass
class Scene:
    script_line: ScriptLine
    audio: AudioAsset
    video: VideoAsset
    output_path: str

@dataclass
class ProjectConfig:
    assets_dir: str
    final_video_path: str
    pexels_api_key: str
