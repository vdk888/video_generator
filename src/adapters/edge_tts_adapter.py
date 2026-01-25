import edge_tts
import os
import subprocess
from src.ports.interfaces import TTSProvider
from src.domain.models import AudioAsset

class EdgeTTSAdapter(TTSProvider):
    def __init__(self, voice: str = "fr-FR-VivienneMultilingualNeural"):
        self.voice = voice

    async def generate_audio(self, text: str, output_path: str) -> AudioAsset:
        communicate = edge_tts.Communicate(text, self.voice)
        
        # We need to generate subtitles. EdgeTTS library usage is a bit distinct for subtitles.
        # The simplest way to get both audio and vtt is to generate the audio, and use the 
        # communicate.stream() to build the VTT manually or use the CLI wrapper which does it well.
        # However, purely pythonic:
        
        sub_path = output_path.replace(".mp3", ".vtt")
        
        # We will use the submaker from edge_tts examples approach or just raw stream processing
        # Use simple approach: Write audio to file.
        # For subtitles, to avoid complexity of rolling our own VTT writer on byte stream, 
        # let's use the exact output format logic if available, or just use the CLI via subprocess 
        # if python API is too low-level for VTT sync. 
        # Actually, `edge-tts` python lib doesn't have a 1-liner "write_with_subtitles".
        # Let's iterate over the stream to write audio and collect timing for VTT.
        
        with open(output_path, "wb") as audio_file:
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_file.write(chunk["data"])
                elif chunk["type"] == "WordBoundary":
                    # We could build word-level subs here, but sentence-level is often better for this.
                    # Given the request is "Live Subtitles", word-level or phrase-level is cool.
                    # But EdgeTTS VTT generation is usually done via their CLI: `edge-tts --write-media ... --write-vtt ...`
                    pass

        # REVISION: To guarantee valid VTT without reinventing the wheel, let's use the CLI wrapper for this step
        # provided we have edge-tts installed (which we do).
        
        # Resolve edge-tts binary path relative to current python executable
        import sys
        bin_dir = os.path.dirname(sys.executable)
        edge_tts_bin = os.path.join(bin_dir, "edge-tts")
        
        # If running on Windows it might be .exe, but assuming Mac/Linux here based on context.
        # Fallback to just "edge-tts" if check fails, relying on PATH.
        if not os.path.exists(edge_tts_bin):
            edge_tts_bin = "edge-tts"

        cmd = [
            edge_tts_bin,
            "--text", text,
            "--write-media", output_path,
            "--write-subtitles", sub_path,
            "--voice", self.voice
        ]
        
        # subprocess.run handles async execution in a blocking way for the call, which is fine here.
        proc = subprocess.run(cmd, capture_output=True, text=True)
        if proc.returncode != 0:
            raise RuntimeError(f"EdgeTTS failed: {proc.stderr}")

        # Get duration
        duration = self._get_duration(output_path)
        
        return AudioAsset(
            file_path=output_path,
            subtitle_path=sub_path,
            duration=duration
        )

    def _get_duration(self, audio_file: str) -> float:
        cmd = [
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", audio_file
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        try:
            return float(result.stdout.strip())
        except ValueError:
            return 0.0
