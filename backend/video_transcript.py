import os
import tempfile
from pathlib import Path
import yt_dlp
from openai import OpenAI
from typing import Dict, Any, Optional
import shutil
import hashlib
import json
from dotenv import load_dotenv
load_dotenv()
class VideoTranscriber:
    def __init__(self, openai_api_key):
        """Initialize with OpenAI API key"""
        self.client = OpenAI(api_key=openai_api_key)
        self.ffmpeg_path = self._find_ffmpeg()
        if not self.ffmpeg_path:
            print("WARNING: FFmpeg not found. Audio extraction will fail.")
            print("Please install FFmpeg: https://ffmpeg.org/download.html")
    
    def _find_ffmpeg(self):
        """Find ffmpeg in PATH or return None"""
        return shutil.which('ffmpeg')
    
    def download_audio_with_metadata(self, video_url, output_path):
        """Download audio and extract metadata in single operation"""
        if not self._is_supported_url(video_url):
            print(f"Error: Only YouTube, Instagram, and Facebook URLs are supported. Got: {video_url}")
            return False, None
        
        ydl_opts = {
            'format': 'worstaudio[ext=m4a]/worstaudio[ext=webm]/worstaudio/worst',  # Much faster
            'outtmpl': str(output_path),
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '64', 
            }],
            'quiet': True,
            'no_warnings': True,
            'socket_timeout': 10,
            'retries': 1,
            'fragment_retries': 1,
            'noplaylist': True,
        }
        
        if self.ffmpeg_path:
            ydl_opts['ffmpeg_location'] = os.path.dirname(self.ffmpeg_path)
        
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                # Get metadata AND download in one call
                info = ydl.extract_info(video_url, download=True)
                
                metadata = {
                    "title": info.get("title", "Unknown Title"),
                    "description": info.get("description", ""),
                    "duration": info.get("duration"),
                    "view_count": info.get("view_count"),
                    "like_count": info.get("like_count"),
                    "comment_count": info.get("comment_count"),
                    "platform": self._get_platform(video_url),
                    "thumbnail": info.get("thumbnail", ""),
                }
                
                return True, metadata
        except Exception as e:
            print(f"Error downloading audio: {str(e)}")
            return False, None
    
    def _is_youtube_url(self, url: str) -> bool:
        """Check if URL is a YouTube URL"""
        return "youtube" in url or "youtu.be" in url
    
    def _is_instagram_url(self, url: str) -> bool:
        """Check if URL is an Instagram URL"""
        return "instagram.com" in url
    
    def _is_facebook_url(self, url: str) -> bool:
        """Check if URL is a Facebook URL"""
        return "facebook.com" in url or "fb.com" in url or "fb.watch" in url
    
    def _is_supported_url(self, url: str) -> bool:
        """Check if URL is supported (YouTube, Instagram, or Facebook)"""
        return self._is_youtube_url(url) or self._is_instagram_url(url) or self._is_facebook_url(url)
    
    def _get_platform(self, url: str) -> str:
        """Determine the platform from the URL"""
        if self._is_youtube_url(url):
            return "youtube"
        elif self._is_instagram_url(url):
            return "instagram"
        elif self._is_facebook_url(url):
            return "facebook"
        else:
            return "unknown"
    

    
    def transcribe_audio(self, audio_file_path):
        """Transcribe audio file using OpenAI Whisper API"""
        try:
            with open(audio_file_path, 'rb') as audio_file:
                transcript = self.client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    response_format="text"
                )
            return transcript
        except Exception as e:
            print(f"Error transcribing audio: {str(e)}")
            return None
    

    
    def transcribe_audio_file(self, file_path):
        """Transcribe an uploaded audio/video file"""
        print(f"Processing file: {file_path}")
        
        # Create temporary directory
        with tempfile.TemporaryDirectory() as temp_dir:
            # Set audio file path
            audio_path = Path(temp_dir) / "audio.mp3"
            
            # Convert video to audio if needed
            if self._is_video_file(file_path):
                print("Converting video to audio...")
                if not self._convert_video_to_audio(file_path, audio_path):
                    return None
            else:
                # Just copy the audio file
                import shutil
                shutil.copy(file_path, audio_path)
            
            # Check file size (OpenAI limit is 25MB)
            file_size_mb = audio_path.stat().st_size / (1024 * 1024)
            if file_size_mb > 25:
                print(f"Warning: File size ({file_size_mb:.1f}MB) exceeds 25MB limit")
                return None
            
            # Transcribe audio
            print("Transcribing audio...")
            transcript = self.transcribe_audio(audio_path)
            
            return transcript
    
    def _is_video_file(self, file_path):
        """Check if file is a video file based on extension"""
        video_extensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm']
        return Path(file_path).suffix.lower() in video_extensions
    
    def _convert_video_to_audio(self, video_path, audio_path):
        """Convert video file to audio using FFmpeg"""
        if not self.ffmpeg_path:
            print("FFmpeg not found. Cannot convert video to audio.")
            return False
        
        try:
            import subprocess
            cmd = [
                self.ffmpeg_path,
                '-i', str(video_path),
                '-vn',  # No video
                '-acodec', 'libmp3lame',
                '-q:a', '2',
                str(audio_path)
            ]
            subprocess.run(cmd, check=True, capture_output=True)
            return True
        except Exception as e:
            print(f"Error converting video to audio: {str(e)}")
            return False
    
    def process_video(self, video_url=None, file_path=None) -> Dict[str, Any]:
        """Process video to extract transcript and metadata"""
        result = {
            "url": video_url,
            "file_path": file_path,
            "success": False,
            "metadata": None,
            "transcript": None
        }
        
        if video_url:
            if not self._is_supported_url(video_url):
                return result
            
            print(f"Processing video: {video_url}")
            
            # Use a persistent directory instead of temporary
            audio_dir = Path("audio_files")
            audio_dir.mkdir(exist_ok=True)
            
            # Generate a simple filename from URL
            url_hash = hashlib.md5(video_url.encode()).hexdigest()[:8]
            audio_path = audio_dir / f"audio_{url_hash}.%(ext)s"
            
            # Combined download + metadata extraction
            print("Downloading audio...")
            success, metadata = self.download_audio_with_metadata(video_url, audio_path)
            
            if success:
                result["metadata"] = metadata
                
                # Find the actual downloaded file
                audio_files = list(audio_dir.glob(f"audio_{url_hash}.*"))
                if audio_files:
                    actual_audio_path = audio_files[0]
                    
                    # Check file size (OpenAI limit is 25MB)
                    file_size_mb = actual_audio_path.stat().st_size / (1024 * 1024)
                    if file_size_mb <= 25:
                        print("Transcribing audio...")
                        transcript = self.transcribe_audio(actual_audio_path)
                        if transcript:
                            result["transcript"] = transcript
                            result["success"] = True
                            print(f"Audio saved to: {actual_audio_path}")
                    else:
                        print(f"Warning: File size ({file_size_mb:.1f}MB) exceeds 25MB limit")
        
        elif file_path:
            # Basic metadata for uploaded file
            file_name = Path(file_path).name
            result["metadata"] = {
                "title": file_name,
                "description": f"Uploaded file: {file_name}",
                "platform": "upload",
            }
            
            # Extract transcript
            transcript = self.transcribe_audio_file(file_path)
            if transcript:
                result["transcript"] = transcript
                result["success"] = True
        
        return result

# Simple function for quick use
def transcribe_video(video_url, openai_api_key):
    """Simple one-line function to transcribe a video URL"""
    transcriber = VideoTranscriber(openai_api_key)
    result = transcriber.process_video(video_url=video_url)
    return result["transcript"] if result["success"] else None

# Function to transcribe uploaded file
def transcribe_file(file_path, openai_api_key):
    """Simple one-line function to transcribe an uploaded audio/video file"""
    transcriber = VideoTranscriber(openai_api_key)
    return transcriber.transcribe_audio_file(file_path)

# Enhanced function to get both transcript and metadata
def process_video(video_url=None, file_path=None, openai_api_key=None):
    """Process video to extract transcript and metadata"""
    transcriber = VideoTranscriber(openai_api_key)
    return transcriber.process_video(video_url, file_path)

def main():
    """Example usage"""
    
    # Set your OpenAI API key
    api_key = os.getenv("OPENAI_API_KEY") # Replace with your actual API key
    
    # Initialize transcriber
    transcriber = VideoTranscriber(api_key)
    
    # Example YouTube URL
    youtube_url = "https://www.youtube.com/watch?v=AfW7yDv1-IA&pp=ygUbaG93IHRvIGNyZWF0ZSB2aXJhbCB0aWt0b2tz"
    
    print(f"\n{'='*50}")
    print(f"Processing YouTube URL: {youtube_url}")
    result = transcriber.process_video(video_url=youtube_url)
    
    if result["success"]:
        print(f"Title: {result['metadata']['title']}")
        print(f"Platform: {result['metadata']['platform']}")
        print(f"Duration: {result['metadata']['duration']} seconds")
        print(f"Views: {result['metadata']['view_count']}")
        print(f"Transcript: {result['transcript']}...")
    else:
        print("Failed to process YouTube video")
    
    # Example Instagram URL (uncomment to test)
    #instagram_url = "https://www.instagram.com/reel/DGvosE5PGJ_/"
    #print(f"\n{'='*50}")
    #print(f"Processing Instagram URL: {instagram_url}")
    #result = transcriber.process_video(video_url=instagram_url)
    #
    #if result["success"]:
    #    print(f"Title: {result['metadata']['title']}")
    #    print(f"Platform: {result['metadata']['platform']}")
    #    print(f"Transcript: {result['transcript']}...")
    #else:
    #    print("Failed to process Instagram video")

    # Example Facebook URL (uncomment to test)
    #facebook_url = "https://www.facebook.com/watch?v=123456789"
    #print(f"\n{'='*50}")
    #print(f"Processing Facebook URL: {facebook_url}")
    #result = transcriber.process_video(video_url=facebook_url)
    #
    #if result["success"]:
    #    print(f"Title: {result['metadata']['title']}")
    #    print(f"Platform: {result['metadata']['platform']}")
    #    print(f"Transcript: {result['transcript'][:100]}...")
    #else:
    #    print("Failed to process Facebook video")
    
    #Example file processing (uncomment to test)
    #file_path = "Download.mp4"
    #print(f"\n{'='*50}")
    #print(f"Processing file: {file_path}")
    #result = transcriber.process_video(file_path=file_path)
    #
    #if result["success"]:
    #    print(f"Title: {result['metadata']['title']}")
    #    print(f"Transcript: {result['transcript']}...")
    #else:
    #     print("Failed to process file")
if __name__ == "__main__":
    main()


