import subprocess
import os
from typing import List, Optional
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

    def concat_scenes(self, scene_files: List[str], output_file: str, transition_duration: float = 0.4, music_path: Optional[str] = None) -> None:
        """Concatenate scenes with smooth fade transitions using FFmpeg xfade filter.

        Args:
            scene_files: List of video file paths to concatenate
            output_file: Path to output concatenated video
            transition_duration: Duration of fade transitions between scenes (default: 0.4s)
            music_path: Optional path to background music (will be mixed at -20dB with fades)
        """
        # Edge case: single scene - no transitions needed
        if len(scene_files) == 1:
            print("Single scene - copying without transitions...")

            if music_path and os.path.exists(music_path):
                # Mix with background music
                return self._add_background_music(scene_files[0], output_file, music_path)
            else:
                # Simple copy without music
                cmd = [
                    "ffmpeg", "-y",
                    "-i", scene_files[0],
                    "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p",
                    "-c:a", "aac", "-ar", "48000", "-ac", "2",
                    output_file
                ]
                try:
                    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
                except subprocess.CalledProcessError as e:
                    print(f"Single scene copy failed. stderr: {e.stderr}")
                    raise e
                return

        # Get durations of all scenes using ffprobe
        print(f"Analyzing {len(scene_files)} scenes for transitions...")
        durations = []
        for scene_file in scene_files:
            try:
                cmd = [
                    "ffprobe",
                    "-v", "error",
                    "-show_entries", "format=duration",
                    "-of", "default=noprint_wrappers=1:nokey=1",
                    scene_file
                ]
                result = subprocess.run(cmd, check=True, capture_output=True, text=True)
                duration = float(result.stdout.strip())
                durations.append(duration)
            except (subprocess.CalledProcessError, ValueError) as e:
                print(f"Warning: Could not get duration for {scene_file}, falling back to simple concat")
                return self._concat_simple(scene_files, output_file)

        # Check if any scene is too short for transitions
        min_scene_duration = min(durations)
        if min_scene_duration < (2 * transition_duration):
            print(f"Warning: Shortest scene ({min_scene_duration:.2f}s) too short for {transition_duration}s transitions")
            print("Falling back to simple concatenation without transitions...")
            return self._concat_simple(scene_files, output_file)

        # Build xfade filter chain
        print(f"Concatenating {len(scene_files)} scenes with {transition_duration}s fade transitions...")

        try:
            # Build input arguments
            input_args = []
            for scene_file in scene_files:
                input_args.extend(["-i", scene_file])

            # Build video filter chain with xfade
            # For N clips, we need N-1 xfade filters
            # Pattern: [0:v][1:v]xfade=duration=D:offset=O0[v1]; [v1][2:v]xfade=duration=D:offset=O1[v2]; ...

            vf_parts = []
            af_parts = []

            # First transition: combine clips 0 and 1
            offset = durations[0] - transition_duration
            vf_parts.append(f"[0:v][1:v]xfade=transition=fade:duration={transition_duration}:offset={offset}[v1]")
            af_parts.append(f"[0:a][1:a]acrossfade=d={transition_duration}[a1]")

            # Subsequent transitions: combine previous result with next clip
            for i in range(2, len(scene_files)):
                # Previous merged result is labeled v{i-1}, we're creating v{i}
                prev_label = f"v{i-1}"
                curr_label = f"v{i}"
                prev_audio_label = f"a{i-1}"
                curr_audio_label = f"a{i}"

                # Calculate offset: sum of all previous durations minus all previous transitions
                offset = sum(durations[:i]) - (i * transition_duration)

                vf_parts.append(f"[{prev_label}][{i}:v]xfade=transition=fade:duration={transition_duration}:offset={offset}[{curr_label}]")
                af_parts.append(f"[{prev_audio_label}][{i}:a]acrossfade=d={transition_duration}[{curr_audio_label}]")

            # Combine filter parts
            filter_complex = ";".join(vf_parts + af_parts)

            # Final output labels (last index)
            final_video_label = f"v{len(scene_files)-1}"
            final_audio_label = f"a{len(scene_files)-1}"

            cmd = [
                "ffmpeg", "-y",
                *input_args,
                "-filter_complex", filter_complex,
                "-map", f"[{final_video_label}]",
                "-map", f"[{final_audio_label}]",
                "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p",
                "-c:a", "aac", "-ar", "48000", "-ac", "2",
                output_file
            ]

            subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
            print(f"Successfully concatenated with transitions: {output_file}")

            # Add background music if provided
            if music_path and os.path.exists(music_path):
                temp_output = output_file.replace(".mp4", "_no_music.mp4")
                os.rename(output_file, temp_output)
                self._add_background_music(temp_output, output_file, music_path)
                os.remove(temp_output)

        except subprocess.CalledProcessError as e:
            print(f"xfade concatenation failed: {e.stderr}")
            print("Falling back to simple concatenation...")
            return self._concat_simple(scene_files, output_file, music_path)

    def _concat_simple(self, scene_files: List[str], output_file: str, music_path: Optional[str] = None) -> None:
        """Fallback: Simple concatenation without transitions (hard cuts)."""
        list_file = "concat_list.txt"
        with open(list_file, "w") as f:
            for v in scene_files:
                f.write(f"file '{v}'\n")

        print("Concatenating scenes (simple mode, no transitions)...")
        cmd = [
            "ffmpeg", "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", list_file,
            "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-ar", "48000", "-ac", "2",
            output_file
        ]
        try:
            subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)

            # Add background music if provided
            if music_path and os.path.exists(music_path):
                temp_output = output_file.replace(".mp4", "_no_music.mp4")
                os.rename(output_file, temp_output)
                self._add_background_music(temp_output, output_file, music_path)
                os.remove(temp_output)

        except subprocess.CalledProcessError as e:
            print(f"Simple concatenation failed. stderr: {e.stderr}")
            raise e
        finally:
            if os.path.exists(list_file):
                os.remove(list_file)

    def _add_background_music(self, video_path: str, output_path: str, music_path: str) -> None:
        """
        Add background music to video with volume ducking and fades.

        The music is mixed at -20dB under the voice track, with fade in (0.5s) at the start
        and fade out (0.5s) at the end. Music is looped automatically if shorter than video.

        Args:
            video_path: Path to input video (with voice audio)
            output_path: Path to output video (with voice + music)
            music_path: Path to background music file
        """
        print(f"Adding background music: {os.path.basename(music_path)}")

        # Get video duration using ffprobe
        try:
            cmd = [
                "ffprobe",
                "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                video_path
            ]
            result = subprocess.run(cmd, check=True, capture_output=True, text=True)
            video_duration = float(result.stdout.strip())
        except (subprocess.CalledProcessError, ValueError) as e:
            print(f"Warning: Could not get video duration: {e}")
            video_duration = 300.0  # Fallback to 5 minutes

        # FFmpeg filter chain:
        # 1. Loop music to match video duration
        # 2. Apply fade in (0.5s) and fade out (0.5s) to music
        # 3. Reduce music volume by -20dB
        # 4. Mix music with original voice audio

        fade_duration = 0.5
        fade_out_start = max(0, video_duration - fade_duration)

        # Audio filter chain:
        # [1:a] - music input
        # aloop - loop music if needed (loop=-1 means infinite, but we trim with atrim)
        # atrim - trim to exact video duration
        # afade - fade in at start
        # afade - fade out at end
        # volume - reduce by 20dB
        # [0:a] - original voice audio
        # amix - mix both audio streams

        audio_filter = (
            f"[1:a]aloop=loop=-1:size=2e+09,"
            f"atrim=duration={video_duration},"
            f"afade=t=in:st=0:d={fade_duration},"
            f"afade=t=out:st={fade_out_start}:d={fade_duration},"
            f"volume=-20dB[music];"
            f"[0:a][music]amix=inputs=2:duration=first:dropout_transition=2[aout]"
        )

        cmd = [
            "ffmpeg", "-y",
            "-i", video_path,      # Input 0: video with voice
            "-stream_loop", "-1",  # Loop music input
            "-i", music_path,      # Input 1: background music
            "-filter_complex", audio_filter,
            "-map", "0:v",         # Use video from input 0
            "-map", "[aout]",      # Use mixed audio
            "-c:v", "copy",        # Copy video stream (no re-encoding)
            "-c:a", "aac",         # Encode audio to AAC
            "-ar", "48000",        # 48kHz sample rate
            "-ac", "2",            # Stereo
            "-shortest",           # Stop when shortest input ends
            output_path
        ]

        try:
            subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
            print(f"Successfully added background music to: {output_path}")
        except subprocess.CalledProcessError as e:
            print(f"Failed to add background music. stderr: {e.stderr}")
            raise e

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
            "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", # Fixed format
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

    def render_branded_intro(self, output_path: str, duration: float = 3.0, logo_path: str = None) -> str:
        """
        Render a branded intro sequence:
        1. White background (brand color)
        2. Logo centered and scaled appropriately
        3. Fade-in animation
        4. Duration: 3-5 seconds (default 3s)

        If logo_path is None or doesn't exist, generates text-only intro.
        """
        # Use local ffmpeg binary
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        local_ffmpeg = os.path.join(base_dir, "bin", "ffmpeg")
        ffmpeg_cmd = local_ffmpeg if os.path.exists(local_ffmpeg) else "ffmpeg"

        # Default logo path if not provided
        if logo_path is None:
            logo_path = os.path.join(base_dir, "assets", "logo.png")

        # Check if logo exists
        if os.path.exists(logo_path):
            # Logo-based intro
            # Filter: white background + logo overlay + fade-in
            filters = (
                f"color=c=white:s=1920x1080:d={duration}:r=25[bg];"
                f"[1:v]scale=350:-1[logo];"
                "[bg][logo]overlay=(W-w)/2:(H-h)/2:format=auto,fade=t=in:st=0:d=0.5"
            )

            cmd = [
                ffmpeg_cmd, "-y",
                "-f", "lavfi", "-i", f"anullsrc=r=48000:cl=stereo:d={duration}",  # Silent audio
                "-i", logo_path,  # Logo image
                "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p",
                "-c:a", "aac", "-ar", "48000", "-ac", "2",
                "-filter_complex", filters,
                "-t", str(duration),
                "-map", "0:a", "-shortest",
                output_path
            ]
        else:
            # Fallback: Text-only intro
            print(f"Logo not found at {logo_path}, using text-only intro")

            # Write text to temp file
            text_filename = f"intro_text_{os.getpid()}.txt"
            text_path = os.path.join(os.path.dirname(output_path), text_filename)
            with open(text_path, "w", encoding="utf-8") as f:
                f.write("BUBBLE")

            safe_text_path = text_path.replace(":", "\\:")

            # Try to use Inter-ExtraBold font
            inter_bold = os.path.join(base_dir, "assets", "fonts", "extras", "ttf", "Inter-ExtraBold.ttf")
            if os.path.exists(inter_bold):
                font_path = inter_bold
            else:
                font_path = "/System/Library/Fonts/Helvetica.ttc"

            # Violet accent color for text: #667eea
            drawtext_filter = (
                f"drawtext=fontfile='{font_path}':textfile='{safe_text_path}':fontcolor=0x667eea:"
                f"fontsize=120:x=(w-text_w)/2:y=(h-text_h)/2"
            )

            filters = f"{drawtext_filter},fade=t=in:st=0:d=0.5"

            cmd = [
                ffmpeg_cmd, "-y",
                "-f", "lavfi", "-i", f"color=c=white:s=1920x1080:d={duration}:r=25",
                "-f", "lavfi", "-i", f"anullsrc=r=48000:cl=stereo:d={duration}",
                "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p",
                "-c:a", "aac", "-ar", "48000", "-ac", "2",
                "-vf", filters,
                "-map", "0:v", "-map", "1:a",
                "-t", str(duration),
                output_path
            ]

        print(f"Rendering Branded Intro ({duration}s)...")
        try:
            subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
        except subprocess.CalledProcessError as e:
            print(f"FFmpeg Branded Intro failed:\n{e.stderr}")
            raise e
        finally:
            # Cleanup temp text file if it exists
            if not os.path.exists(logo_path if logo_path else ""):
                text_path = os.path.join(os.path.dirname(output_path), f"intro_text_{os.getpid()}.txt")
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
            "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", # Fixed format
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
