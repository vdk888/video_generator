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
    
    use_case = GenerateVideoUseCase(tts, media, renderer, config)
    
    # 3. Execution
    # Assuming script.json is in project root for now, or use config to find it.
    script_path = os.path.join(os.path.dirname(config.final_video_path), "script.json")
    await use_case.execute(script_path)

if __name__ == "__main__":
    asyncio.run(main())
