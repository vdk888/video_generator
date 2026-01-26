import os
import asyncio
import base64
import subprocess
from typing import Optional
from openai import AsyncOpenAI
from src.ports.interfaces import TTSProvider
from src.domain.models import AudioAsset

class OpenAITTSAdapter(TTSProvider):
    def __init__(self, api_key: str, model: str = "openai/gpt-audio-mini"):
        """
        Adapter for OpenAI's high-quality TTS (via OpenRouter chat audio).
        """
        self.client = AsyncOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=api_key,
        )
        self.model = model

    async def generate_audio(self, text: str, output_path: str, highlight_word: Optional[str] = None) -> AudioAsset:
        """
        Generate audio using OpenRouter's GPT Audio (PCM16 Stream -> FFmpeg WAV).
        Also generates subtitles (ASS).
        """
        print(f"Generating High-Quality Audio for: '{text[:30]}...'")
        
        # 1. Generate Raw PCM16 Audio
        # OpenRouter requires stream=True and format=pcm16 for audio
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                modalities=["text", "audio"],
                audio={"voice": "alloy", "format": "pcm16"}, # 'alloy' is standard clear voice
                messages=[
                    {"role": "user", "content": text}
                ],
                stream=True
            )

            audio_buffer = bytearray()
            
            async for chunk in response:
                if not chunk.choices:
                    continue
                delta = chunk.choices[0].delta
                
                if hasattr(delta, 'audio') and delta.audio and 'data' in delta.audio:
                    chunk_data = base64.b64decode(delta.audio['data'])
                    audio_buffer.extend(chunk_data)
            
            if len(audio_buffer) == 0:
                raise Exception("No audio data received from API")
                
            # 2. Save RAW and Convert to standard WAV (MP3 leads to issues with concat sometimes, WAV is safer for intermediate)
            # Actually, the system expects .mp3 for final assets usually? 
            # Looking at previous code, AudioAsset tracks .mp3.
            # Let's save as .mp3 directly via ffmpeg conversion.
            
            # Temp raw file
            raw_path = output_path + ".pcm"
            with open(raw_path, "wb") as f:
                f.write(audio_buffer)
                
            # Convert: PCM16 LE, 24kHz, Mono -> MP3 48kHz Stereo (Standardize for project)
            cmd = [
                "ffmpeg", "-y",
                "-f", "s16le", "-ar", "24000", "-ac", "1", "-i", raw_path,
                "-ar", "48000", "-ac", "2", "-b:a", "192k",
                output_path
            ]
            
            subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
            
            # Clean up raw
            if os.path.exists(raw_path):
                os.remove(raw_path)

        except Exception as e:
            print(f"OpenAI TTS Failed: {e}")
            raise e
            
        # 3. Get Duration (probe)
        duration = self._get_audio_duration(output_path)
            
        # 4. Generate Subtitles (ASS)
        # For now, simplistic generation matching duration. 
        # Ideally we'd use word-level timestamps if the API provided them (Whisper does, TTS maybe not yet).
        # We will create a simple subtitle file that displays the full text for the duration.
        # Or split by simple heuristic?
        # EdgeTTS gave us word timings. OpenAI TTS does NOT give word timings yet.
        # We must generate a subtitle file that fits.
        subtitle_path = output_path.replace(".mp3", ".ass")
        self._generate_simple_subtitles(text, subtitle_path, duration, highlight_word)
        
        return AudioAsset(
            file_path=output_path,
            duration=duration,
            subtitle_path=subtitle_path,
            word_timings=[] # No timings available in OpenAI TTS yet
        )

    def _get_audio_duration(self, file_path: str) -> float:
        cmd = [
            "ffprobe", 
            "-v", "error", 
            "-show_entries", "format=duration", 
            "-of", "default=noprint_wrappers=1:nokey=1", 
            file_path
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        try:
            return float(result.stdout.strip())
        except:
            return 3.0 # Fallback

    def _generate_simple_subtitles(self, text: str, output_path: str, duration: float, highlight_word: Optional[str]):
        # Heuristic Segmentation for Better UX
        # Instead of one static block, we split by punctuation/length.
        # Max words per sub: 7-8?
        
        # 1. Split text into chunks
        import re
        # Split by typical sentence, pulse marks
        # But keep it simple: Split by ~10 words or roughly 40 chars
        words = text.split()
        chunks = []
        current_chunk = []
        current_len = 0
        
        for w in words:
            if current_len + len(w) > 40: # Max char width
                chunks.append(" ".join(current_chunk))
                current_chunk = [w]
                current_len = len(w)
            else:
                current_chunk.append(w)
                current_len += len(w) + 1
        
        if current_chunk:
            chunks.append(" ".join(current_chunk))
            
        # 2. Distribute duration
        # Very naive: equal time per chunk.
        # Improvement: Time proportional to char length
        total_chars = len(text)
        chunk_durations = []
        current_start = 0.0
        
        # Avoid div by zero
        if total_chars == 0: 
            total_chars = 1
            
        for chunk in chunks:
            # Prop time
            ratio = len(chunk) / total_chars
            d = duration * ratio
            chunk_durations.append((current_start, current_start + d, chunk))
            current_start += d
            
        # 3. Generate ASS
        header = """[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 1

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Inter,60,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,2,0,2,10,10,50,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
        def format_time(seconds):
            m, s = divmod(seconds, 60)
            h, m = divmod(m, 60)
            cs = int((s - int(s)) * 100)
            return f"{int(h)}:{int(m):02}:{int(s):02}.{cs:02}"

        highlight_ass = r"{\c&Hea7e66&}"
        reset_ass = r"{\c&HFFFFFF&}"

        with open(output_path, "w") as f:
            f.write(header)
            
            for start_sec, end_sec, chunk_text in chunk_durations:
                # Apply highlight if word is in this chunk
                display_text = chunk_text
                if highlight_word and highlight_word in chunk_text:
                    display_text = chunk_text.replace(highlight_word, f"{highlight_ass}{highlight_word}{reset_ass}")
                
                s_str = format_time(start_sec)
                e_str = format_time(end_sec)
                
                line = f"Dialogue: 0,{s_str},{e_str},Default,,0,0,0,,{display_text}\n"
                f.write(line)
