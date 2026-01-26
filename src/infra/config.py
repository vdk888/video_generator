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
        
    return ProjectConfig(
        assets_dir=assets_dir,
        final_video_path=os.path.join(project_dir, "final_output.mp4"),
        pexels_api_key=api_key,
        openrouter_api_key=os.getenv("OPENROUTER_API_KEY", ""),
        openrouter_model=os.getenv("OPENROUTER_MODEL", "gpt-4o-mini")
    )
