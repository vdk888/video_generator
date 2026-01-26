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
    
    # NEW: Voice - Provider selection via TTS_PROVIDER env var
    # Options: "openai" (default), "elevenlabs", "edge"
    tts_provider = os.getenv("TTS_PROVIDER", "openai").lower()

    if tts_provider == "elevenlabs":
        elevenlabs_key = os.getenv("ELEVENLABS_API_KEY")
        if not elevenlabs_key:
            print("ERROR: ELEVENLABS_API_KEY not found in environment")
            return
        elevenlabs_voice = os.getenv("ELEVENLABS_VOICE_ID", "EXAVITQu4vr4xnSDxMaL")  # Bella (female) by default
        from src.adapters.elevenlabs_adapter import ElevenLabsAdapter
        tts = ElevenLabsAdapter(elevenlabs_key, elevenlabs_voice)
        print(f"Using ElevenLabs TTS (voice: {elevenlabs_voice})")
    elif tts_provider == "edge":
        tts = EdgeTTSAdapter()
        print("Using Edge TTS (free)")
    else:
        # Default: OpenAI TTS via OpenRouter
        from src.adapters.openai_tts_adapter import OpenAITTSAdapter
        tts = OpenAITTSAdapter(openrouter_key, "openai/gpt-audio-mini")
        print("Using OpenAI TTS (via OpenRouter)")

    # NEW: Music Service
    music = None
    if config.enable_background_music:
        from src.adapters.music_adapter import MusicAdapter
        music = MusicAdapter(config.music_dir)
        print(f"Music service enabled (mood: {config.music_mood})")

    # NEW: Avatar Service (HeyGen)
    avatar = None
    if config.heygen_api_key:
        from src.adapters.heygen_adapter import HeyGenAdapter
        avatar = HeyGenAdapter(config.heygen_api_key)
        print(f"HeyGen avatar service enabled (avatar: {config.heygen_default_avatar_id})")

    use_case = GenerateVideoUseCase(tts, media, renderer, config, music, avatar)
    
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
