import subprocess
import os
from typing import List
from src.ports.interfaces import Renderer
from src.domain.models import Scene

class FFmpegAdapter(Renderer):
    def render_scene(self, scene: Scene) -> str:
        """
        Render a scene:
        1. Loop video input
        2. Mix with audio
        3. Burn subtitles
        """
        # Escape path for FFmpeg filter
        sub_path = os.path.abspath(scene.audio.subtitle_path)
        
        # Subtitle style: reduced size, modern look, Inter-like
        # Chart: Clean, readable. White text on video is standard.
        # Reduced FontSize from 24 to 16 as requested.
        # Attempt to use 'Inter' if installed, otherwise system default fallback
        style = "FontSize=16,PrimaryColour=&H00FFFFFF,OutlineColour=&H80000000,BorderStyle=3,Outline=1,Shadow=0,MarginV=30,Alignment=2,FontName=Inter"
        subtitles_filter = f"subtitles='{sub_path}':force_style='{style}'"

        # Use local ffmpeg binary if available
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        local_ffmpeg = os.path.join(base_dir, "bin", "ffmpeg")
        ffmpeg_cmd = local_ffmpeg if os.path.exists(local_ffmpeg) else "ffmpeg"

        cmd = [
            ffmpeg_cmd, "-y",
            "-stream_loop", "-1", "-i", scene.video.file_path,
            "-i", scene.audio.file_path,
            "-map", "0:v", "-map", "1:a",
            "-c:v", "libx264", "-preset", "ultrafast",
            "-c:a", "aac", "-ar", "48000", "-ac", "2", # Force standard audio format
            "-vf", f"scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=25,{subtitles_filter}",
            "-shortest",
            "-t", str(scene.audio.duration),
            scene.output_path
        ]
        
        print(f"Rendering scene to {scene.output_path}...")
        try:
            subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
        except subprocess.CalledProcessError as e:
            print(f"FFmpeg failed with error:\n{e.stderr}")
            raise e
        return scene.output_path

    def concat_scenes(self, scene_files: List[str], output_file: str) -> None:
        list_file = "concat_list.txt"
        with open(list_file, "w") as f:
            for v in scene_files:
                f.write(f"file '{v}'\n")
        
        print("Concatenating scenes...")
        # Note: -c copy works ONLY if all inputs have exact same stream format (resolution, fps, SAR, audio rate/channels/codec)
        cmd = [
            "ffmpeg", "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", list_file,
            "-c", "copy",
            output_file
        ]
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
        os.remove(list_file)

    def normalize_video(self, input_path: str, output_path: str) -> str:
        # Use local ffmpeg binary if available (redundant check but safe)
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        local_ffmpeg = os.path.join(base_dir, "bin", "ffmpeg")
        ffmpeg_cmd = local_ffmpeg if os.path.exists(local_ffmpeg) else "ffmpeg"

        cmd = [
            ffmpeg_cmd, "-y",
            "-i", input_path,
            "-c:v", "libx264", "-preset", "ultrafast",
            "-c:a", "aac", "-ar", "48000", "-ac", "2", # Standardize Audio
            "-vf", "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=25",
            output_path
        ]
        
        print(f"Normalizing video {input_path}...")
        try:
            subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
        except subprocess.CalledProcessError as e:
            print(f"FFmpeg normalize failed:\n{e.stderr}")
            raise e
        return output_path

    def render_title_card(self, text: str, output_path: str, duration: float = 3.0) -> str:
        # Use local ffmpeg binary
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        local_ffmpeg = os.path.join(base_dir, "bin", "ffmpeg")
        ffmpeg_cmd = local_ffmpeg if os.path.exists(local_ffmpeg) else "ffmpeg"

        # Modern Title Card: WHITE background (Bubble Chart), Black Text
        
        
        # 1. Write text to file to avoid FFmpeg escaping hell
        text_filename = f"title_text_{os.getpid()}.txt"
        text_path = os.path.join(os.path.dirname(output_path), text_filename)
        with open(text_path, "w", encoding="utf-8") as f:
            f.write(text)
        
        safe_text_path = text_path.replace(":", "\\:")
        
        # 2. Font Setup
        font_size = 90 # Slightly larger for impact
        font_color = "black" 
        
        # Use downloaded Inter font if available
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        inter_bold = os.path.join(base_dir, "assets", "fonts", "extras", "ttf", "Inter-ExtraBold.ttf")
        
        if os.path.exists(inter_bold):
            font_path = inter_bold
        else:
            # Fallback
            font_path = "/System/Library/Fonts/Helvetica.ttc"
            if not os.path.exists(font_path):
                 font_path = "/System/Library/Fonts/Supplemental/Arial.ttf" 
        
        # 3. Construct Filter Chain
        drawtext_filter = (
            f"drawtext=fontfile='{font_path}':textfile='{safe_text_path}':fontcolor={font_color}:"
            f"fontsize={font_size}:x=(w-text_w)/2:y=(h-text_h)/2"
        )
        
        filters = f"{drawtext_filter},fade=t=in:st=0:d=0.5,fade=t=out:st={duration-0.5}:d=0.5"

        cmd = [
            ffmpeg_cmd, "-y",
            "-f", "lavfi", "-i", f"color=c=white:s=1920x1080:d={duration}", # White BG
            "-f", "lavfi", "-i", f"anullsrc=r=48000:cl=stereo:d={duration}", 
            "-c:v", "libx264", "-preset", "ultrafast",
            "-c:a", "aac", "-ar", "48000", "-ac", "2", # Force standard audio
            "-vf", filters,
            "-map", "0:v", "-map", "1:a",
            output_path
        ]
        
        print(f"Rendering Title Card via file: '{text}'...")
        try:
            subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
        except subprocess.CalledProcessError as e:
            print(f"FFmpeg Title Card failed:\n{e.stderr}")
            if os.path.exists(text_path):
                os.remove(text_path)
            raise e
            
        if os.path.exists(text_path):
            os.remove(text_path)
            
        return output_path
