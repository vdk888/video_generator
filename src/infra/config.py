import os
from dotenv import load_dotenv
from src.domain.models import ProjectConfig

def load_config(project_name: str = "default") -> ProjectConfig:
    # Load .env from project root (shared env)
    root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    load_dotenv(os.path.join(root_dir, ".env"))
    
    api_key = os.getenv("PEXELS_API_KEY")
    if not api_key:
        raise ValueError("PEXELS_API_KEY not found in environment")
        
    # Project Dir logic
    # projects/{project_name}
    project_dir = os.path.join(root_dir, "projects", project_name)
    os.makedirs(project_dir, exist_ok=True)
    
    # Assets inside project dir
    assets_dir = os.path.join(project_dir, "assets")
    os.makedirs(assets_dir, exist_ok=True)

    # Branding asset paths (from VIDEO_BIBLE.md)
    logo_path = os.path.join(root_dir, "assets", "logo.png")
    outro_video = os.path.join(root_dir, "vidu-video-3072694396319459.mov")

    # Music settings
    music_dir = os.path.join(root_dir, "assets", "music")
    music_mood = os.getenv("MUSIC_MOOD", "ambient_cinematic")
    enable_music = os.getenv("ENABLE_BACKGROUND_MUSIC", "true").lower() == "true"

    return ProjectConfig(
        assets_dir=assets_dir,
        final_video_path=os.path.join(project_dir, "final_output.mp4"),
        pexels_api_key=api_key,
        openrouter_api_key=os.getenv("OPENROUTER_API_KEY", ""),
        openrouter_model=os.getenv("OPENROUTER_MODEL", "gpt-4o-mini"),
        music_dir=music_dir,
        music_mood=music_mood,
        enable_background_music=enable_music,
        logo_path=logo_path if os.path.exists(logo_path) else None,
        intro_video_path=None,  # Generated dynamically by render_branded_intro
        outro_video_path=outro_video if os.path.exists(outro_video) else None,
        heygen_api_key=os.getenv("HEYGEN_API_KEY", ""),
        heygen_default_avatar_id=os.getenv("HEYGEN_DEFAULT_AVATAR_ID", "Angela-inblackskirt-20220820"),
        heygen_default_voice_id=os.getenv("HEYGEN_DEFAULT_VOICE_ID", "1bd001e7e50f421d891986aad5158bc8")
    )
