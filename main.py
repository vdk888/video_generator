import asyncio
import os
from src.infra.config import load_config
from src.adapters.edge_tts_adapter import EdgeTTSAdapter
from src.adapters.pexels_adapter import PexelsAdapter
from src.adapters.ffmpeg_adapter import FFmpegAdapter
from src.app.use_cases import GenerateVideoUseCase

async def main():
    # 1. Config
    try:
        config = load_config()
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
    
    use_case = GenerateVideoUseCase(tts, media, renderer, config)
    
    # 3. Execution
    # A. Check for raw source
    raw_source_path = "raw_source.txt"
    script_json_path = "script.json"
    
    if os.path.exists(raw_source_path):
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
        print("No raw_source.txt found. Using existing script.json if available.")

    # B. Generate Video
    # Assuming script.json is in project root for now, or use config to find it.
    script_path = os.path.join(os.path.dirname(config.final_video_path), "script.json")
    await use_case.execute(script_path)

if __name__ == "__main__":
    asyncio.run(main())
