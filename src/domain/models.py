from dataclasses import dataclass
from typing import List, Optional

@dataclass
class ScriptLine:
    text: str
    search_query: str = ""
    type: str = "speech" # "speech" or "title"
    highlight_word: Optional[str] = None
    custom_media_path: Optional[str] = None
    scene_type: str = "broll"  # "broll", "avatar", or "title"

@dataclass
class AudioAsset:
    file_path: str
    subtitle_path: Optional[str] = None
    duration: float = 0.0
    word_timings: Optional[List[dict]] = None

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
    openrouter_api_key: str = ""
    openrouter_model: str = "gpt-4o-mini"
    music_dir: str = "assets/music"
    music_mood: str = "ambient_cinematic"
    enable_background_music: bool = True
    logo_path: Optional[str] = None
    intro_video_path: Optional[str] = None
    outro_video_path: Optional[str] = None
    heygen_api_key: str = ""
    heygen_default_avatar_id: str = "Angela-inblackskirt-20220820"
    heygen_default_voice_id: str = "1bd001e7e50f421d891986aad5158bc8"
