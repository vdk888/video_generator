import asyncio
import os
from src.infra.config import load_config
from src.adapters.edge_tts_adapter import EdgeTTSAdapter
from src.adapters.pexels_adapter import PexelsAdapter
from src.adapters.ffmpeg_adapter import FFmpegAdapter
from src.app.use_cases import GenerateVideoUseCase

async def main():
    config = load_config()
    tts = EdgeTTSAdapter()
    media = PexelsAdapter(config.pexels_api_key)
    renderer = FFmpegAdapter()
    
    use_case = GenerateVideoUseCase(tts, media, renderer, config)
    
    # Use the test script
    script_path = "script_override_test.json"
    if not os.path.exists(script_path):
        print(f"Error: {script_path} not found")
        return

    print("Running Override Test...")
    await use_case.execute(script_path)

if __name__ == "__main__":
    asyncio.run(main())
