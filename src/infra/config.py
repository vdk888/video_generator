import os
from dotenv import load_dotenv
from src.domain.models import ProjectConfig

def load_config() -> ProjectConfig:
    # Load .env from project root
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    load_dotenv(os.path.join(base_dir, ".env"))
    
    api_key = os.getenv("PEXELS_API_KEY")
    if not api_key:
        raise ValueError("PEXELS_API_KEY not found in environment")
        
    return ProjectConfig(
        assets_dir=os.path.join(base_dir, "assets"),
        final_video_path=os.path.join(base_dir, "final_output.mp4"),
        pexels_api_key=api_key
    )
