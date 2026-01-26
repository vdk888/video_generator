"""
HeyGen Avatar Adapter
Implements the AvatarProvider interface using HeyGen API for AI avatar video generation.
"""

import asyncio
import os
import subprocess
from pathlib import Path
from typing import Optional
import aiohttp
import json


class HeyGenAdapter:
    """
    Adapter for HeyGen API to generate AI avatar videos.

    Video Generation Flow:
    1. Submit video generation request to HeyGen API
    2. Poll status endpoint until video is completed
    3. Download the completed video
    4. Normalize to 1920x1080@25fps yuv420p for pipeline compatibility
    """

    def __init__(self, api_key: str):
        """
        Initialize HeyGen adapter.

        Args:
            api_key: HeyGen API key for authentication
        """
        if not api_key:
            raise ValueError("HeyGen API key is required")

        self.api_key = api_key
        self.base_url = "https://api.heygen.com"
        self.headers = {
            "X-Api-Key": self.api_key,
            "Content-Type": "application/json"
        }

    async def generate_avatar_video(
        self,
        text: str,
        avatar_id: str,
        voice_id: str,
        output_path: Path
    ) -> Path:
        """
        Generate avatar video from text using HeyGen API.

        Args:
            text: The script text for the avatar to speak
            avatar_id: ID of the avatar to use (e.g., "Angela-inblackskirt-20220820")
            voice_id: ID of the voice to use (e.g., "1bd001e7e50f421d891986aad5158bc8")
            output_path: Path where the final normalized video should be saved

        Returns:
            Path to the normalized avatar video (1920x1080@25fps yuv420p)

        Raises:
            Exception: If video generation fails or times out
        """
        print(f"Generating HeyGen avatar video...")
        print(f"  Avatar: {avatar_id}")
        print(f"  Voice: {voice_id}")
        print(f"  Text length: {len(text)} chars")

        # Step 1: Create video generation request
        video_id = await self._create_video(text, avatar_id, voice_id)
        print(f"  Video ID: {video_id}")

        # Step 2: Poll for completion
        video_url = await self._poll_video_status(video_id)
        print(f"  Video ready: {video_url}")

        # Step 3: Download video
        download_path = Path(str(output_path).replace(".mp4", "_raw.mp4"))
        await self._download_video(video_url, download_path)
        print(f"  Downloaded: {download_path}")

        # Step 4: Normalize video to standard format
        self._normalize_video(download_path, Path(output_path))
        print(f"  Normalized: {output_path}")

        # Clean up raw download
        if download_path.exists():
            download_path.unlink()

        return Path(output_path)

    async def _create_video(self, text: str, avatar_id: str, voice_id: str) -> str:
        """
        Submit video generation request to HeyGen API.

        Returns:
            video_id: The ID of the video generation job
        """
        url = f"{self.base_url}/v2/video/generate"

        payload = {
            "video_inputs": [
                {
                    "character": {
                        "type": "avatar",
                        "avatar_id": avatar_id
                    },
                    "voice": {
                        "type": "text",
                        "input_text": text,
                        "voice_id": voice_id
                    }
                }
            ],
            "dimension": {
                "width": 1920,
                "height": 1080
            },
            "aspect_ratio": "16:9"
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(url, headers=self.headers, json=payload) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"HeyGen API error (status {response.status}): {error_text}")

                data = await response.json()

                # HeyGen returns: {"data": {"video_id": "..."}}
                if "data" not in data or "video_id" not in data["data"]:
                    raise Exception(f"Unexpected HeyGen response format: {data}")

                return data["data"]["video_id"]

    async def _poll_video_status(
        self,
        video_id: str,
        max_wait_seconds: int = 600,
        poll_interval: int = 5
    ) -> str:
        """
        Poll HeyGen API until video generation is complete.

        Args:
            video_id: The video generation job ID
            max_wait_seconds: Maximum time to wait (default: 10 minutes)
            poll_interval: Seconds between status checks (default: 5 seconds)

        Returns:
            video_url: URL of the completed video

        Raises:
            Exception: If video generation fails or times out
        """
        url = f"{self.base_url}/v1/video_status.get"
        elapsed = 0

        async with aiohttp.ClientSession() as session:
            while elapsed < max_wait_seconds:
                async with session.get(
                    url,
                    headers=self.headers,
                    params={"video_id": video_id}
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        raise Exception(f"HeyGen status check failed (status {response.status}): {error_text}")

                    data = await response.json()

                    # Response format: {"data": {"status": "...", "video_url": "..."}}
                    if "data" not in data:
                        raise Exception(f"Unexpected HeyGen status response: {data}")

                    status = data["data"].get("status", "")

                    if status == "completed":
                        video_url = data["data"].get("video_url", "")
                        if not video_url:
                            raise Exception("Video completed but no URL provided")
                        return video_url

                    elif status == "failed":
                        error = data["data"].get("error", "Unknown error")
                        raise Exception(f"HeyGen video generation failed: {error}")

                    elif status in ["pending", "processing"]:
                        # Still generating, wait and poll again
                        print(f"  Status: {status}... ({elapsed}s elapsed)")
                        await asyncio.sleep(poll_interval)
                        elapsed += poll_interval

                    else:
                        # Unknown status
                        raise Exception(f"Unknown HeyGen status: {status}")

        raise Exception(f"HeyGen video generation timed out after {max_wait_seconds}s")

    async def _download_video(self, video_url: str, output_path: Path) -> None:
        """
        Download video from HeyGen URL to local path.

        Args:
            video_url: URL of the completed video
            output_path: Local path to save the video
        """
        output_path.parent.mkdir(parents=True, exist_ok=True)

        async with aiohttp.ClientSession() as session:
            async with session.get(video_url) as response:
                if response.status != 200:
                    raise Exception(f"Failed to download video from {video_url}: status {response.status}")

                # Stream download to file
                with open(output_path, "wb") as f:
                    async for chunk in response.content.iter_chunked(8192):
                        f.write(chunk)

    def _normalize_video(self, input_path: Path, output_path: Path) -> None:
        """
        Normalize video to standard format: 1920x1080@25fps yuv420p.

        This ensures compatibility with the rest of the video pipeline.

        Args:
            input_path: Path to the raw downloaded video
            output_path: Path to save the normalized video
        """
        cmd = [
            "ffmpeg",
            "-y",  # Overwrite output file
            "-i", str(input_path),
            "-vf", "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black",
            "-r", "25",
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            "-ar", "48000",
            "-ac", "2",
            str(output_path)
        ]

        result = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        if result.returncode != 0:
            raise Exception(f"FFmpeg normalization failed: {result.stderr}")
