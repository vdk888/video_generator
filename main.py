import json
import os
import subprocess
import requests
import asyncio
import edge_tts
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
PEXELS_API_KEY = os.getenv("PEXELS_API_KEY")

# Resolve paths relative to this script
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SCRIPT_FILE = os.path.join(BASE_DIR, "script.json")
OUTPUT_DIR = os.path.join(BASE_DIR, "assets")
FINAL_VIDEO = os.path.join(BASE_DIR, "final_output.mp4")

if not PEXELS_API_KEY:
    # Try reading from .env file explicitly if not in environment
    env_path = os.path.join(BASE_DIR, ".env")
    load_dotenv(env_path)
    PEXELS_API_KEY = os.getenv("PEXELS_API_KEY")

if not PEXELS_API_KEY:
    raise ValueError("PEXELS_API_KEY not found in .env file or environment")

# Ensure output directory exists
os.makedirs(OUTPUT_DIR, exist_ok=True)

async def generate_audio(text, output_file):
    """Generate audio from text using edge-tts."""
    print(f"Generating audio for: {text[:30]}...")
    communicate = edge_tts.Communicate(text, "fr-FR-VivienneMultilingualNeural") # French voice
    await communicate.save(output_file)

def get_audio_duration(audio_file):
    """Get duration of audio file using ffprobe."""
    cmd = [
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", audio_file
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    try:
        return float(result.stdout.strip())
    except ValueError:
        print(f"Error getting duration for {audio_file}. Output: {result.stdout}, Stderr: {result.stderr}")
        return 5.0 # Fallback

def download_video(query, output_file, min_duration):
    """Search and download video from Pexels."""
    print(f"Searching Pexels for: {query}")
    headers = {"Authorization": PEXELS_API_KEY}
    url = f"https://api.pexels.com/videos/search?query={query}&per_page=1&orientation=landscape"
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        if not data.get("videos"):
            print(f"No videos found for '{query}'. Using fallback.")
            return False

        video_data = data["videos"][0]
        video_files = video_data.get("video_files", [])
        
        # Pick the best quality HD file (width >= 1280) but not too huge
        best_video = None
        for v in video_files:
            if v["width"] >= 1920: # Prefer 1080p
                best_video = v
                break
        if not best_video and video_files:
            best_video = video_files[0]
            
        if best_video:
            link = best_video["link"]
            print(f"Downloading video from {link}...")
            video_content = requests.get(link).content
            with open(output_file, "wb") as f:
                f.write(video_content)
            return True
        
    except Exception as e:
        print(f"Error downloading video: {e}")
    
    return False

def create_segment_video(audio_path, video_path, output_path, duration):
    """
    Create a video segment:
    - Loop video if shorter than audio.
    - Trim video to match audio length.
    - Add audio.
    """
    # Create a temporary looped video
    # Command: ffmpeg -stream_loop -1 -i video.mp4 -i audio.mp3 -shortest -map 0:v -map 1:a -c:v libx264 -c:a aac -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" output.mp4
    
    # Simpler approach: 
    # 1. Loop video input indefinitely
    # 2. Input audio
    # 3. Cut at audio length (-shortest only works if audio is shorter, which it is in this logic)
    # Be careful, -stream_loop must be before -i input
    
    cmd = [
        "ffmpeg", "-y",
        "-stream_loop", "-1", "-i", video_path,
        "-i", audio_path,
        "-map", "0:v", "-map", "1:a",
        "-c:v", "libx264", "-preset", "ultrafast",   # Fast encoding
        "-c:a", "aac",
        "-vf", "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=25", # Normalize resolution and framerate
        "-shortest",
        "-t", str(duration), # Explicitly limit to audio duration to be safe
        output_path
    ]
    
    subprocess.run(cmd, check=True)

def concat_videos(video_files, final_output):
    """Concatenate all segment videos."""
    list_file = "concat_list.txt"
    with open(list_file, "w") as f:
        for v in video_files:
            f.write(f"file '{v}'\n")
    
    print("Concatenating videos...")
    cmd = [
        "ffmpeg", "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", list_file,
        "-c", "copy",
        final_output
    ]
    subprocess.run(cmd, check=True)
    os.remove(list_file)

async def main():
    with open(SCRIPT_FILE, "r") as f:
        script = json.load(f)
    
    segment_videos = []
    
    for i, item in enumerate(script):
        text = item["text"]
        query = item["search_query"]
        
        audio_path = os.path.join(OUTPUT_DIR, f"audio_{i}.mp3")
        video_raw_path = os.path.join(OUTPUT_DIR, f"video_raw_{i}.mp4")
        segment_output = os.path.join(OUTPUT_DIR, f"segment_{i}.mp4")
        
        # 1. Audio
        if not os.path.exists(audio_path):
            await generate_audio(text, audio_path)
            
        duration = get_audio_duration(audio_path)
        print(f"Segment {i} Duration: {duration}s")
        
        # 2. Video Download
        if not os.path.exists(video_raw_path):
            success = download_video(query, video_raw_path, duration)
            if not success:
                # Use a specific fallback or fail? Let's assume we have a fallback or just use previous?
                # For this demo, let's try a generic query if specific fails
                print("Trying generic fallback...")
                success = download_video("abstract technology background", video_raw_path, duration)
                if not success:
                     # Create a black video as last resort?
                     # ffmpeg -f lavfi -i color=c=black:s=1920x1080 -t 5 output.mp4
                     pass

        # 3. Assembly Segment
        if os.path.exists(video_raw_path):
            create_segment_video(audio_path, video_raw_path, segment_output, duration)
            segment_videos.append(segment_output)
        else:
            print(f"Skipping segment {i} due to missing video source.")

    # 4. Final Concat
    if segment_videos:
        concat_videos(segment_videos, FINAL_VIDEO)
        print(f"Video generated successfully: {FINAL_VIDEO}")
    else:
        print("No segments created.")

if __name__ == "__main__":
    asyncio.run(main())
