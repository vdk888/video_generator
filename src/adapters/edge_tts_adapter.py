from typing import Optional
import edge_tts
import os
import subprocess
from src.ports.interfaces import TTSProvider
from src.domain.models import AudioAsset

class EdgeTTSAdapter(TTSProvider):
    def __init__(self, voice: str = "fr-FR-VivienneMultilingualNeural"):
        self.voice = voice

    async def generate_audio(self, text: str, output_path: str, highlight_word: Optional[str] = None) -> AudioAsset:
        # 1. Generate Audio & VTT
        communicate = edge_tts.Communicate(text, self.voice)
        vtt_path = output_path.replace(".mp3", ".vtt")
        ass_path = output_path.replace(".mp3", ".ass")
        
        # Use CLI to generate VTT properly
        import sys
        bin_dir = os.path.dirname(sys.executable)
        edge_tts_bin = os.path.join(bin_dir, "edge-tts")
        if not os.path.exists(edge_tts_bin):
            edge_tts_bin = "edge-tts"

        cmd = [
            edge_tts_bin,
            "--text", text,
            "--write-media", output_path,
            "--write-subtitles", vtt_path,
            "--voice", self.voice
        ]
        
        proc = subprocess.run(cmd, capture_output=True, text=True)
        if proc.returncode != 0:
            raise RuntimeError(f"EdgeTTS failed: {proc.stderr}")

        # 2. Convert VTT to ASS (Color highlight logic)
        self._convert_vtt_to_ass(vtt_path, ass_path, highlight_word)

        # Get duration
        duration = self._get_duration(output_path)
        
        return AudioAsset(
            file_path=output_path,
            subtitle_path=ass_path, # Return ASS path
            duration=duration
        )

    def _convert_vtt_to_ass(self, vtt_path: str, ass_path: str, highlight_word: Optional[str]) -> None:
        """
        Convert WebVTT to ASS format with custom styling and keyword highlighting.
        Bubble Identity:
        - Font: Inter (or Arial fallback)
        - Primary Color: White (&H00FFFFFF)
        - Outline: Black (&H80000000)
        - Highlight Color: Bubble Violet #667eea -> BGR &HEA7E66&
        """
        
        # ASS Header
        # Note: PlayResX/Y 1920x1080 matched to video
        header = """[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Inter,40,&H00FFFFFF,&H000000FF,&H80000000,&H80000000,-1,0,0,0,100,100,0,0,1,2,0,2,50,50,50,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
        
        events = []
        
        with open(vtt_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
        
        # Simple VTT Parser (assumes standard edge-tts output)
        # 00:00:00.000 --> 00:00:02.500
        # Text line
        
        import re
        
        # Regex for VTT timestamp: 00:00:00.000 or 00:00:00,000
        time_pattern = re.compile(r"(\d{2}):(\d{2}):(\d{2})[.,](\d{3})\s-->\s(\d{2}):(\d{2}):(\d{2})[.,](\d{3})")
        
        current_start = None
        current_end = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            if "WEBVTT" in line:
                continue
                
            match = time_pattern.match(line)
            if match:
                # Convert timestamp from HH:MM:SS.ms to H:MM:SS.cs (ASS format)
                # VTT: 00:00:01.500 -> ASS: 0:00:01.50
                
                h1, m1, s1, ms1, h2, m2, s2, ms2 = match.groups()
                
                start_ass = f"{int(h1)}:{m1}:{s1}.{int(ms1)//10:02d}"
                end_ass = f"{int(h2)}:{m2}:{s2}.{int(ms2)//10:02d}"
                
                current_start = start_ass
                current_end = end_ass
                continue
            
            # Text line (only if we have timestamps ready)
            if current_start and current_end:
                text = line
                
                # Apply Highlight
                if highlight_word and highlight_word.lower() in text.lower():
                    # Case insensitive replacement, but keep original case
                    # Regex replacement to wrap with color tags
                    # Highlight Color: &HEA7E66& (Violet #667eea)
                    # Reset Color: &HFFFFFF& (White)
                    pattern = re.compile(re.escape(highlight_word), re.IGNORECASE)
                    text = pattern.sub(lambda m: f"{{\\c&HEA7E66&}}{m.group(0)}{{\\c&HFFFFFF&}}", text)
                
                events.append(f"Dialogue: 0,{current_start},{current_end},Default,,0,0,0,,{text}")
                
                # Reset for next block
                current_start = None
                current_end = None

        with open(ass_path, "w", encoding="utf-8") as f:
            f.write(header)
            f.write("\n".join(events))

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
