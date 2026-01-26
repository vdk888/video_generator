import os
import subprocess
import aiohttp
from typing import Optional
from src.ports.interfaces import TTSProvider
from src.domain.models import AudioAsset


class ElevenLabsAdapter(TTSProvider):
    """
    Adapter for ElevenLabs high-quality TTS API.

    API Reference:
    - Endpoint: POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}
    - Headers: xi-api-key: YOUR_API_KEY
    - Body: {"text": "...", "model_id": "eleven_multilingual_v2"}
    - Response: audio/mpeg stream (MP3)
    """

    # Default French voices
    VOICE_IDS = {
        "bella": "EXAVITQu4vr4xnSDxMaL",  # Female
        "adam": "pNInz6obpgDQGcFmaJgB",   # Male
    }

    def __init__(self, api_key: str, voice_id: str = "EXAVITQu4vr4xnSDxMaL", model_id: str = "eleven_multilingual_v2"):
        """
        Initialize ElevenLabs TTS adapter.

        Args:
            api_key: ElevenLabs API key
            voice_id: Voice ID (default: Bella - French female)
            model_id: Model to use (default: eleven_multilingual_v2)
        """
        self.api_key = api_key
        self.voice_id = voice_id
        self.model_id = model_id
        self.base_url = "https://api.elevenlabs.io/v1"

    async def generate_audio(self, text: str, output_path: str, highlight_word: Optional[str] = None) -> AudioAsset:
        """
        Generate audio using ElevenLabs TTS API.

        Args:
            text: Text to synthesize
            output_path: Path to save MP3 file
            highlight_word: Optional word to highlight in subtitles

        Returns:
            AudioAsset with file path, duration, and subtitle path
        """
        print(f"Generating ElevenLabs Audio for: '{text[:30]}...'")

        # 1. Call ElevenLabs API
        url = f"{self.base_url}/text-to-speech/{self.voice_id}"
        headers = {
            "xi-api-key": self.api_key,
            "Content-Type": "application/json"
        }
        payload = {
            "text": text,
            "model_id": self.model_id,
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75
            }
        }

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=headers, json=payload) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        raise Exception(f"ElevenLabs API error {response.status}: {error_text}")

                    # Stream MP3 data directly to file
                    with open(output_path, "wb") as f:
                        async for chunk in response.content.iter_chunked(8192):
                            f.write(chunk)

            print(f"Audio saved to: {output_path}")

        except Exception as e:
            print(f"ElevenLabs TTS Failed: {e}")
            raise e

        # 2. Get audio duration via ffprobe
        duration = self._get_audio_duration(output_path)

        # 3. Generate subtitles (ASS format)
        subtitle_path = output_path.replace(".mp3", ".ass")
        self._generate_simple_subtitles(text, subtitle_path, duration, highlight_word)

        return AudioAsset(
            file_path=output_path,
            duration=duration,
            subtitle_path=subtitle_path,
            word_timings=[]  # ElevenLabs doesn't provide word-level timings
        )

    def _get_audio_duration(self, file_path: str) -> float:
        """
        Get duration of audio file using ffprobe.

        Args:
            file_path: Path to audio file

        Returns:
            Duration in seconds
        """
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
            return 3.0  # Fallback duration

    def _generate_simple_subtitles(self, text: str, output_path: str, duration: float, highlight_word: Optional[str]):
        """
        Generate ASS subtitle file with text chunking and optional highlighting.

        Uses same approach as OpenAITTSAdapter:
        - Splits text into ~40 char chunks
        - Distributes duration proportionally
        - Highlights specified word in brand color

        Args:
            text: Full text to subtitle
            output_path: Path to save ASS file
            duration: Total audio duration
            highlight_word: Optional word to highlight
        """
        # 1. Split text into chunks (max ~40 chars per chunk)
        words = text.split()
        chunks = []
        current_chunk = []
        current_len = 0

        for w in words:
            if current_len + len(w) > 40:
                chunks.append(" ".join(current_chunk))
                current_chunk = [w]
                current_len = len(w)
            else:
                current_chunk.append(w)
                current_len += len(w) + 1

        if current_chunk:
            chunks.append(" ".join(current_chunk))

        # 2. Distribute duration proportionally to chunk length
        total_chars = len(text) if len(text) > 0 else 1
        chunk_durations = []
        current_start = 0.0

        for chunk in chunks:
            ratio = len(chunk) / total_chars
            d = duration * ratio
            chunk_durations.append((current_start, current_start + d, chunk))
            current_start += d

        # 3. Generate ASS file
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
            """Convert seconds to ASS timestamp format (H:MM:SS.CS)"""
            m, s = divmod(seconds, 60)
            h, m = divmod(m, 60)
            cs = int((s - int(s)) * 100)
            return f"{int(h)}:{int(m):02}:{int(s):02}.{cs:02}"

        # Brand color for highlights (from Charte Graphique)
        highlight_ass = r"{\c&Hea7e66&}"  # Bubble orange
        reset_ass = r"{\c&HFFFFFF&}"

        with open(output_path, "w") as f:
            f.write(header)

            for start_sec, end_sec, chunk_text in chunk_durations:
                # Apply highlight if word is in this chunk
                display_text = chunk_text
                if highlight_word and highlight_word in chunk_text:
                    display_text = chunk_text.replace(
                        highlight_word,
                        f"{highlight_ass}{highlight_word}{reset_ass}"
                    )

                s_str = format_time(start_sec)
                e_str = format_time(end_sec)

                line = f"Dialogue: 0,{s_str},{e_str},Default,,0,0,0,,{display_text}\n"
                f.write(line)
