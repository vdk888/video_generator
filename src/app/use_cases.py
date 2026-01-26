import json
import os
import asyncio
from typing import List, Optional
from src.domain.models import ScriptLine, Scene, ProjectConfig
from src.ports.interfaces import TTSProvider, MediaProvider, Renderer, MusicService, AvatarProvider

class GenerateVideoUseCase:
    def __init__(
        self,
        tts: TTSProvider,
        media: MediaProvider,
        renderer: Renderer,
        config: ProjectConfig,
        music: Optional[MusicService] = None,
        avatar: Optional[AvatarProvider] = None
    ):
        self.tts = tts
        self.media = media
        self.renderer = renderer
        self.config = config
        self.music = music
        self.avatar = avatar

    async def execute(self, script_path: str):
        # 1. Load Script
        with open(script_path, "r") as f:
            raw_script = json.load(f)
        
        script_lines = [
            ScriptLine(
                text=item["text"],
                search_query=item.get("search_query", ""),
                type=item.get("type", "speech"),
                highlight_word=item.get("highlight_word"),
                custom_media_path=item.get("custom_media_path"),
                scene_type=item.get("scene_type", "broll")
            ) for item in raw_script
        ]

        scenes: List[str] = []

        # 0. Prepend Branded Intro
        intro_output = os.path.join(self.config.assets_dir, "intro_branded.mp4")
        if not os.path.exists(intro_output):
            self.renderer.render_branded_intro(intro_output, duration=3.0, logo_path=self.config.logo_path)
        scenes.append(intro_output)
        print("Branded intro added.")
        
        for i, line in enumerate(script_lines):
            print(f"--- Processing Line {i+1} ---")
            
            # Paths
            scene_output = os.path.join(self.config.assets_dir, f"scene_{i}.mp4")

            # Route based on scene_type
            if line.scene_type == "title" or line.type == "title":
                # Render Title Card
                self.renderer.render_title_card(line.text, scene_output)
                scenes.append(scene_output)
                continue

            elif line.scene_type == "avatar":
                # Generate Avatar Video
                if not self.avatar:
                    print(f"WARNING: Avatar scene requested but no avatar provider configured. Falling back to broll.")
                    # Fall through to broll processing
                else:
                    # Generate avatar video directly (includes audio)
                    avatar_video = await self.avatar.generate_avatar_video(
                        text=line.text,
                        avatar_id=self.config.heygen_default_avatar_id,
                        voice_id=self.config.heygen_default_voice_id,
                        output_path=scene_output
                    )
                    scenes.append(str(avatar_video))
                    continue

            # Standard Speech Scene (broll)
            audio_path = os.path.join(self.config.assets_dir, f"audio_{i}.mp3")
            video_raw_path = os.path.join(self.config.assets_dir, f"video_raw_{i}.mp4")
            
            # A. Generate Audio & Subtitles
            # Check if exists to skip? For now regenerate to ensure subtitles are fresh if code changed
            audio_asset = await self.tts.generate_audio(line.text, audio_path, line.highlight_word)
            print(f"Audio generated: {audio_asset.duration}s")
            
            # B. Get Media
            if line.custom_media_path:
                if os.path.exists(line.custom_media_path):
                     print(f"Using Custom Media: {line.custom_media_path}")
                     # Create VideoAsset directly
                     from src.domain.models import VideoAsset
                     video_asset = VideoAsset(file_path=line.custom_media_path)
                else:
                     print(f"WARNING: Custom media path not found: {line.custom_media_path}")
                     print("Fallback: Creating Dramatic Text Scene (Luxury Bg + Text)")
                     
                     # 1. Search for a premium background
                     # "abstract dark texture" or "luxury black background"
                     fallback_query = "abstract dark luxury texture cinematic"
                     video_asset = self.media.search_video(fallback_query, video_raw_path, audio_asset.duration)
                     
                     # 2. Force Dramatic Text Effect
                     # The renderer draws 'highlight_word' huge on screen.
                     # We set it to the full text (or the provided text) to ensure the "Text Over Image" effect.
                     # Note: The renderer centers specific words. If we put the whole sentence, it might be too long for the huge font?
                     # Let's keep the ORIGINAL highlight word if present, otherwise pick a key word?
                     # OR, user said "image with the text over it".
                     # If I set highlight_word=line.text, it displays the WHOLE text huge.
                     # FFmpeg Adapter uses: fontsize=170. 
                     # If text is long, this will go off screen.
                     # Compromise: If highlight_word is set, use it. If not, use the first 3 words + "..."?
                     # Or just trust the original script's highlight?
                     # User said "text over it", implying the content. 
                     # Let's assume the script has a highlight word for dramatic scenes.
                     # If NOT, we force one.
                     if not line.highlight_word:
                        # Pick the longest word as a heuristic for "Subject"
                        import re
                        words = re.findall(r'\w+', line.text)
                        if words:
                            line.highlight_word = max(words, key=len)
            else:
                # Normal Pexels Search
                video_asset = self.media.search_video(line.search_query, video_raw_path, audio_asset.duration)
            
            # C. Render Scene
            scene = Scene(
                script_line=line,
                audio=audio_asset,
                video=video_asset,
                output_path=scene_output
            )
            
            self.renderer.render_scene(scene)
            scenes.append(scene_output)
            
        # 1.5 Append Outro (Moved from Intro)
        intro_raw = os.path.join(os.path.dirname(self.config.assets_dir), "vidu-video-3072694396319459.mov")
        
        if os.path.exists(intro_raw):
            outro_normalized = os.path.join(self.config.assets_dir, "outro_normalized.mp4")
            if not os.path.exists(outro_normalized):
                self.renderer.render_logo_outro(intro_raw, outro_normalized)
            scenes.append(outro_normalized)
            print("Outro added.")

        # 2. Get background music if enabled
        music_path = None
        if self.config.enable_background_music and self.music:
            try:
                # Calculate approximate total duration for music selection
                # This is rough - actual video duration will be determined by FFmpeg
                total_duration = sum(
                    float(os.popen(f'ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "{scene}"').read().strip() or "0")
                    for scene in scenes[:3]  # Sample first 3 scenes to estimate
                ) * (len(scenes) / min(3, len(scenes)))

                music_track = self.music.get_music_track(self.config.music_mood, total_duration)
                music_path = str(music_track)
                print(f"Background music selected: {music_track.name}")
            except Exception as e:
                print(f"Warning: Could not load background music: {e}")
                print("Continuing without background music...")

        # 3. Concat with transitions and background music
        if scenes:
            # Use default transition duration from VIDEO_BIBLE.md (0.4s)
            self.renderer.concat_scenes(scenes, self.config.final_video_path, transition_duration=0.4, music_path=music_path)
            print("Video generation complete!")
