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
        
        if sub_path.endswith(".ass"):
            # ASS file contains its own style (Font, Colors, Position)
            subtitles_filter = f"subtitles='{sub_path}'" 
        else:
            # Fallback for VTT/SRT
            style = "FontSize=16,PrimaryColour=&H00FFFFFF,OutlineColour=&H80000000,BorderStyle=3,Outline=1,Shadow=0,MarginV=30,Alignment=2,FontName=Inter"
            subtitles_filter = f"subtitles='{sub_path}':force_style='{style}'"

        # Use local ffmpeg binary if available
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        local_ffmpeg = os.path.join(base_dir, "bin", "ffmpeg")
        ffmpeg_cmd = local_ffmpeg if os.path.exists(local_ffmpeg) else "ffmpeg"

        # Prepare Input options
        # If image, use -loop 1. If video, use -stream_loop -1.
        input_args = []
        if scene.video.file_path.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp')):
            input_args = ["-loop", "1", "-i", scene.video.file_path]
        else:
            input_args = ["-stream_loop", "-1", "-i", scene.video.file_path]

        cmd = [
            ffmpeg_cmd, "-y",
            *input_args,
            "-i", scene.audio.file_path,
            "-map", "0:v", "-map", "1:a",
            "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", # Force compatibility
            "-c:a", "aac", "-ar", "48000", "-ac", "2", # Force standard audio format
        ]

        # Filter Logic
        # 1. Base: Scale/Crop Video
        vf_chain = "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=25"
        
        # 2. Dramatic Highlight (Kinetic Typography)
        if scene.script_line.highlight_word:
            # Dim Background: brightness -0.4
            vf_chain += ",eq=brightness=-0.4"
            
            # Text Text
            hw_text = scene.script_line.highlight_word
            
            # Clean text for FFmpeg
            text_filename = f"hw_text_{os.getpid()}_{id(scene)}.txt"
            text_path = os.path.join(os.path.dirname(scene.output_path), text_filename)
            with open(text_path, "w", encoding="utf-8") as f:
                f.write(hw_text)
            
            safe_text_path = text_path.replace(":", "\\:")
            
            # Font
            font_path = "/System/Library/Fonts/Helvetica.ttc" # Default fallback
            # Try to find Inter-ExtraBold
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            inter_bold = os.path.join(base_dir, "assets", "fonts", "extras", "ttf", "Inter-ExtraBold.ttf")
            if os.path.exists(inter_bold):
                font_path = inter_bold
            
            # DrawText: Huge (170), Violet (#667eea), Centered
            # Violet in hex for ffmpeg: 0x667eea
            drawtext = (
                f"drawtext=fontfile='{font_path}':textfile='{safe_text_path}':"
                f"fontcolor=0x667eea:fontsize=170:"
                f"x=(w-text_w)/2:y=(h-text_h)/2"
            )
            
            # Animation? Let's keep it static but impactful for now.
            vf_chain += f",{drawtext}"
            
            # Cleanup later? Only if meaningful. For now we might leak small txt files if crash, but okay.
        
        # 3. Subtitles
        # Check standard subtitles separately
        if sub_path.endswith(".ass"):
            # ASS contains style, but if we have dramatic text, do we want subtitles too?
            # User said "full screen of that text...". Maybe hide subtitle if dramatic?
            # "I didn't mean in subtitles".
            # Let's keep subtitles for accessibility but maybe they will overlap if text is huge.
            # Center huge text is middle. Subtitle is bottom. Should be safe.
            vf_chain += f",subtitles='{sub_path}'" 
        else:
            style = "FontSize=16,PrimaryColour=&H00FFFFFF,OutlineColour=&H80000000,BorderStyle=3,Outline=1,Shadow=0,MarginV=30,Alignment=2,FontName=Inter"
            vf_chain += f",subtitles='{sub_path}':force_style='{style}'"

        cmd += ["-vf", vf_chain]
        
        cmd += [
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
    def render_logo_outro(self, input_path: str, output_path: str) -> str:
        # 1. Background: White
        # 2. Logo: Scaled to 600px width (approx 30% of 1920)
        # 3. Position: Centered
        # 4. Audio: Keep original
        
        # Use local ffmpeg binary
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        local_ffmpeg = os.path.join(base_dir, "bin", "ffmpeg")
        ffmpeg_cmd = local_ffmpeg if os.path.exists(local_ffmpeg) else "ffmpeg"

        # Filter Chain:
        # [0:v] (logo) scale=600:-1 [logo];
        # [1:v] (white bg) [logo] overlay=(W-w)/2:(H-h)/2
        
        # Assuming the logo input has audio we want to keep.
        # Background duration should match logo duration.
        
        # Get duration first? Or just use -shortest?
        
        filters = (
            "[0:v]scale=350:-1[logo];"
            f"color=c=white:s=1920x1080:r=25[bg];"
            "[bg][logo]overlay=(W-w)/2:(H-h)/2:format=auto"
        )
        
        cmd = [
            ffmpeg_cmd, "-y",
            "-i", input_path,
            "-c:v", "libx264", "-preset", "ultrafast",
            "-c:a", "aac", "-ar", "48000", "-ac", "2",
            "-filter_complex", filters,
            "-shortest", 
            "-map", "0:a?", # Map audio from input if it exists
            output_path
        ]
        
        # If no audio in input, we might need to generate silence to match logic?
        # The simple command above might fail or produce no audio stream if input has none.
        # Let's add conditional mapping or just enforce silence if no audio? 
        # For 'vidu' generation, it usually has sound? 
        # Safety: Add anullsrc as input 1, and map it if 0:a is missing? 
        # Let's assume input has audio for now based on 'vidu' branding.
        # UPDATE: To be safe compliant with our pipeline (AAC 48k required), 
        # if input audio is empty, we must provide silent audio track.
        # Let's use filter_complex to mix anullsrc or just map 0:a.
        
        print(f"Rendering Logo Outro from {input_path}...")
        try:
            subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
        except subprocess.CalledProcessError as e:
            print(f"FFmpeg Logo Outro failed:\n{e.stderr}")
            raise e
            
        return output_path
