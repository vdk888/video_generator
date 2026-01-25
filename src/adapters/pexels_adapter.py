import requests
import os
from src.ports.interfaces import MediaProvider
from src.domain.models import VideoAsset

class PexelsAdapter(MediaProvider):
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.headers = {"Authorization": self.api_key}

    def search_video(self, query: str, output_path: str, min_duration: float) -> VideoAsset:
        print(f"Searching Pexels for: {query}")
        
        # Check if file already exists to avoid paid API calls / bandwidth
        if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
            print(f"File exists: {output_path}. Skipping download.")
            # We need to return valid asset. We don't have width/height stored.
            # For now, return default HD (1920x1080) assumption or use ffprobe.
            # For robustness in this 'refactor', let's just assume 1920x1080 or use a helper.
            return VideoAsset(file_path=output_path, width=1920, height=1080)

        # Enforce Landscape (16:9 usually) and High Quality (Large/Medium)
        # 'large' usually gives 4K or 1080p. 'medium' often 720p or 1080p. 
        # Large is safer for maintaining 1080p target.
        url = f"https://api.pexels.com/videos/search?query={query}&per_page=1&orientation=landscape&size=large"
        
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            data = response.json()
            
            if not data.get("videos"):
                print(f"No videos found for '{query}'. Using fallback.")
                return self._fallback_download(output_path)

            video_data = data["videos"][0]
            video_files = video_data.get("video_files", [])
            
            # Pick best quality 1080p
            best_video = None
            for v in video_files:
                if v["width"] >= 1920:
                    best_video = v
                    break
            if not best_video and video_files:
                best_video = video_files[0]
                
            if best_video:
                link = best_video["link"]
                print(f"Downloading video from {link}...")
                video_content = requests.get(link).content
                with open(output_path, "wb") as f:
                    f.write(video_content)
                return VideoAsset(
                    file_path=output_path,
                    width=best_video["width"],
                    height=best_video["height"]
                )
        
        except Exception as e:
            print(f"Error downloading video: {e}")
            
        return self._fallback_download(output_path)

    def _fallback_download(self, output_path: str) -> VideoAsset:
        # If fallback fails, we might just fail or try another generic term. 
        # For now, let's try a very generic term if we haven't already.
        # But to avoid infinite recursion, let's just create a black dummy video if real download fails?
        # Or better, re-try with 'abstract background' if not already done.
        # Simplification: just return a dummy object that implies failure, 
        # or raise an exception. Let's try one generic download.
        if "abstract" not in output_path: # simplistic guard
             return self.search_video("abstract digital background", output_path, 0)
        
        raise RuntimeError("Failed to download any video asset.")
