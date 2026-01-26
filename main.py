import asyncio
import os
from src.infra.config import load_config
from src.adapters.edge_tts_adapter import EdgeTTSAdapter
from src.adapters.pexels_adapter import PexelsAdapter
from src.adapters.ffmpeg_adapter import FFmpegAdapter
from src.app.use_cases import GenerateVideoUseCase

async def main():
    # 1. Config
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--project", type=str, default="default", help="Project name (isolation folder)")
    args = parser.parse_args()

    # 1. Config
    try:
        config = load_config(args.project)
    except Exception as e:
        print(f"Config Error: {e}")
        return

    # 2. Setup (Dep Injection)
    tts = EdgeTTSAdapter()
    media = PexelsAdapter(config.pexels_api_key)
    renderer = FFmpegAdapter()
    
    # New: Script Generator
    # Load keys for OpenRouter
    from dotenv import load_dotenv
    load_dotenv()
    
    openrouter_key = os.getenv("OPENROUTER_API_KEY")
    openrouter_model = os.getenv("OPENROUTER_MODEL", "gpt-4o-mini")
    
    from src.adapters.openrouter_adapter import OpenRouterAdapter
    script_gen = OpenRouterAdapter(openrouter_key, openrouter_model)
    
    # NEW: Voice
    # Was EdgeTTSAdapter. Now OpenAITTSAdapter (using same OpenRouter Key for audio)
    # Model: "openai/gpt-audio-mini" (Audio capability)
    from src.adapters.openai_tts_adapter import OpenAITTSAdapter
    tts = OpenAITTSAdapter(openrouter_key, "openai/gpt-audio-mini") 
    
    use_case = GenerateVideoUseCase(tts, media, renderer, config)
    
    # B. Generate Video
    # Project paths
    project_dir = os.path.dirname(config.final_video_path)
    raw_source_path = os.path.join(project_dir, "raw_source.txt")
    script_json_path = os.path.join(project_dir, "script.json")
    
    print(f"Working in Project: {args.project} ({project_dir})")
    
    if os.path.exists(script_json_path):
        print(f"Found existing {script_json_path}. Skipping LLM generation (Director Mode).")
    elif os.path.exists(raw_source_path):
        print(f"Reading raw source from {raw_source_path}...")
        with open(raw_source_path, "r") as f:
            raw_text = f.read()
            
        print("Generating enriched script via LLM (Segmentation, Visuals, Highlights)...")
        enriched_script = await script_gen.generate_script(raw_text)
        
        # Save to script.json
        import json
        with open(script_json_path, "w") as f:
            json.dump(enriched_script, f, indent=2, ensure_ascii=False)
        print(f"Script saved to {script_json_path}")
    else:
        print(f"No script.json or raw_source.txt found in {project_dir}. Please add one.")
        # Create dummy for convenience?
        return

    await use_case.execute(script_json_path)

if __name__ == "__main__":
    asyncio.run(main())
