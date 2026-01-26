import asyncio
import os
from openai import AsyncOpenAI
from src.infra.config import load_config

async def test_openrouter_tts():
    config = load_config()
    print(f"Testing OpenRouter TTS with key: {config.openrouter_api_key[:5]}...")
    
    client = AsyncOpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=config.openrouter_api_key,
    )

    try:
        # User pointed to openai/gpt-audio-mini
        # This is likely a multimodal chat model, not a standard TTS endpoint model.
        # We need to use chat.completions.create with modalities=["text", "audio"]
        
        model = "openai/gpt-audio-mini"
        print(f"Attempting generation with model: {model} via Chat Completions...")
        
        # Audio params
        # Note: OpenRouter/OpenAI requires stream=True for audio
        # AND format must be pcm16 for streaming
        response = await client.chat.completions.create(
            model=model,
            modalities=["text", "audio"],
            audio={"voice": "alloy", "format": "pcm16"},
            messages=[
                {"role": "user", "content": "Ceci est un test streaming PCM16 de la voix."}
            ],
            stream=True
        )
        
        print("Streaming response (PCM16)...")
        import base64
        import subprocess
        
        audio_buffer = bytearray()
        audio_id = None
        
        async for chunk in response:
            if not chunk.choices:
                continue
                
            delta = chunk.choices[0].delta
            
            # Capture ID if present
            if hasattr(delta, 'audio') and delta.audio:
                if 'id' in delta.audio:
                    audio_id = delta.audio['id']
                if 'data' in delta.audio:
                    chunk_data = base64.b64decode(delta.audio['data'])
                    audio_buffer.extend(chunk_data)
        
        if len(audio_buffer) > 0:
            raw_path = "test_tts.pcm"
            wav_path = "test_tts_openrouter.wav"
            
            with open(raw_path, "wb") as f:
                f.write(audio_buffer)
            print(f"Saved raw PCM to {raw_path}. Size: {len(audio_buffer)}")
            
            # Convert to WAV (Assuming 24kHz mono based on OpenAI specs)
            cmd = [
                "ffmpeg", "-y",
                "-f", "s16le", "-ar", "24000", "-ac", "1", "-i", raw_path,
                wav_path
            ]
            subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
            print(f"Success! Converted to {wav_path}")
            
        else:
            print("Stream finished but no audio data received.")

    except Exception as e:
        print(f"OpenRouter Chat Audio Failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_openrouter_tts())
