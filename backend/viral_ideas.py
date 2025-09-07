from openai import OpenAI
import json
from typing import Dict, List, Any, Optional

class AIScriptGenerator:
    def __init__(self, openai_api_key):
        """Initialize with OpenAI API key"""
        self.client = OpenAI(api_key=openai_api_key)
    
    def analyze_and_generate(self, transcript: str, brand_info: str, platform: str = "general", metadata: Optional[Dict[str, Any]] = None) -> Dict:
        """Generate script and viral video ideas based on transcript and metadata"""
        
        # Create comprehensive prompt
        prompt = self.create_analysis_prompt(transcript, brand_info, platform, metadata)
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o",  # Latest model for best results
                messages=[
                    {
                        "role": "system", 
                        "content": "You are an expert viral marketing copywriter who analyzes successful content and creates high-converting scripts and video ideas."
                    },
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ],
                temperature=0.7,  # Creative but focused
                max_tokens=2000
            )
            
            return self.parse_response(response.choices[0].message.content)
            
        except Exception as e:
            return {"error": f"Failed to generate content: {str(e)}"}
    
    def create_analysis_prompt(self, transcript: str, brand_info: str, platform: str, metadata: Optional[Dict[str, Any]] = None) -> str:
        """Create detailed prompt for analysis and generation"""
        
        platform_specs = {
            "tiktok": "15-60 second videos, vertical format, trending sounds, quick cuts",
            "instagram": "15-90 second reels, aesthetic visuals, trending hashtags",
            "youtube": "60 second shorts or longer form, engaging thumbnails",
            "facebook": "30-60 seconds, social sharing focus, emotional hooks",
            "general": "adaptable to multiple platforms"
        }
        
        spec = platform_specs.get(platform.lower(), platform_specs["general"])
        
        # Add metadata if available
        metadata_str = ""
        if metadata:
            metadata_str = f"""
            VIDEO METADATA:
            Title: {metadata.get('title', 'N/A')}
            Description: {metadata.get('description', 'N/A')[:200]}...
            Duration: {metadata.get('duration', 'N/A')} seconds
            Views: {metadata.get('view_count', 'N/A')}
            Likes: {metadata.get('like_count', 'N/A')}
            Comments: {metadata.get('comment_count', 'N/A')}
            Tags: {', '.join(metadata.get('tags', [])[:10])}
            """
        
        return f"""
        Analyze this successful video content and create similar content for my brand:

        {metadata_str}

        ORIGINAL TRANSCRIPT:
        "{transcript}"

        MY BRAND INFO:
        {brand_info}

        TARGET PLATFORM: {platform.title()} ({spec})

        Please provide:

        1. **VIRAL ELEMENTS ANALYSIS**
        - What made this content engaging?
        - Key hooks and attention grabbers used
        - Emotional triggers identified
        - Content structure breakdown

        2. **ADAPTED MAIN SCRIPT** (optimized for {platform})
        Format as a ready-to-film script with:
        - HOOK (first 3 seconds)
        - MAIN MESSAGE (core content)
        - CALL TO ACTION (closing)
        - [Visual cues in brackets]

        3. **5 VIRAL VIDEO IDEAS** inspired by this content
        Each idea should include:
        - Concept title
        - 30-second script outline
        - Why it would go viral
        - Specific platform optimization

        4. **CONTENT SERIES IDEAS** (3 ideas)
        - Multi-part content themes
        - How to extend this concept

        5. **HASHTAG STRATEGY**
        - 10 relevant hashtags for {platform}
        - Mix of trending and niche tags

        Make everything actionable and brand-specific. Focus on what will actually convert viewers into customers.
        """
    
    def parse_response(self, response_text: str) -> Dict:
        """Parse the AI response into structured data"""
        
        try:
            # Split response into sections
            sections = {
                "viral_analysis": "",
                "main_script": "",
                "viral_ideas": [],
                "series_ideas": [],
                "hashtags": []
            }
            
            current_section = None
            lines = response_text.split('\n')
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                
                # Identify sections
                if "VIRAL ELEMENTS ANALYSIS" in line.upper():
                    current_section = "viral_analysis"
                elif "ADAPTED MAIN SCRIPT" in line.upper():
                    current_section = "main_script"
                elif "VIRAL VIDEO IDEAS" in line.upper():
                    current_section = "viral_ideas"
                elif "CONTENT SERIES IDEAS" in line.upper():
                    current_section = "series_ideas"
                elif "HASHTAG STRATEGY" in line.upper():
                    current_section = "hashtags"
                elif current_section:
                    sections[current_section] += line + "\n"
            
            return {
                "success": True,
                "viral_analysis": sections["viral_analysis"].strip(),
                "main_script": sections["main_script"].strip(),
                "viral_ideas": sections["viral_ideas"].strip(),
                "series_ideas": sections["series_ideas"].strip(),
                "hashtags": sections["hashtags"].strip(),
                "raw_response": response_text
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to parse response: {str(e)}",
                "raw_response": response_text
            }
    
    def generate_quick_hooks(self, transcript: str, count: int = 5, metadata: Optional[Dict[str, Any]] = None) -> List[str]:
        """Generate quick hook variations"""
        
        # Add metadata context if available
        metadata_context = ""
        if metadata:
            metadata_context = f"""
            This video has {metadata.get('view_count', 'many')} views and {metadata.get('like_count', 'many')} likes.
            Title: {metadata.get('title', '')}
            """
        
        prompt = f"""
        Based on this successful video transcript:
        "{transcript}"
        
        {metadata_context}
        
        Generate {count} powerful hook variations that could grab attention in the first 3 seconds.
        Make them punchy, curiosity-driven, and scroll-stopping.
        
        Format as a simple list.
        """
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.8,
                max_tokens=300
            )
            
            hooks = response.choices[0].message.content.strip().split('\n')
            return [hook.strip('- ').strip() for hook in hooks if hook.strip()]
            
        except Exception as e:
            return [f"Error generating hooks: {str(e)}"]
    
    def analyze_viral_patterns(self, video_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze patterns that make a video viral"""
        
        transcript = video_data.get("transcript", "")
        metadata = video_data.get("metadata", {})
        
        # Skip if no transcript
        if not transcript:
            return {"error": "No transcript available for analysis"}
        
        prompt = f"""
        Analyze this viral video content and identify what makes it successful:
        
        TITLE: {metadata.get('title', 'Unknown')}
        VIEWS: {metadata.get('view_count', 'Unknown')}
        LIKES: {metadata.get('like_count', 'Unknown')}
        PLATFORM: {metadata.get('platform', 'Unknown')}
        
        TRANSCRIPT:
        "{transcript}"
        
        Please identify:
        1. The key hook technique used (curiosity gap, shock value, etc.)
        2. The emotional triggers (FOMO, inspiration, etc.)
        3. The content structure pattern (problem-solution, storytelling, etc.)
        4. The pacing/editing style (fast cuts, long-form, etc.)
        5. The call-to-action approach
        6. Any unique elements that likely contributed to virality
        
        Format as JSON with these keys: hook_technique, emotional_triggers, content_structure, pacing_style, cta_approach, unique_elements
        """
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0.5,
                max_tokens=800
            )
            
            analysis = json.loads(response.choices[0].message.content)
            return {"success": True, "analysis": analysis}
            
        except Exception as e:
            return {"success": False, "error": f"Failed to analyze viral patterns: {str(e)}"}

# Add this new class for managing chat sessions
class ViralContentChatSession:
    def __init__(self, openai_api_key):
        """Initialize chat session with OpenAI API key"""
        self.client = OpenAI(api_key=openai_api_key)
        self.conversation_history = []
        self.analyzed_videos = []
        self.brand_info = None
    
    def add_analyzed_video(self, video_data: Dict[str, Any]):
        """Add an analyzed video to the session's knowledge base"""
        if not video_data.get("success", False):
            return False
        
        # Extract key information for the knowledge base
        video_summary = {
            "url": video_data.get("source_url", ""),
            "title": video_data.get("metadata", {}).get("title", "Unknown video"),
            "transcript_snippet": video_data.get("transcript", "")[:200] + "...",
            "viral_elements": video_data.get("viral_analysis", ""),
            "viral_patterns": video_data.get("viral_patterns", {}),
            "hooks": video_data.get("hooks", [])[:3],
            "added_at": video_data.get("timestamp", "")
        }
        
        self.analyzed_videos.append(video_summary)
        
        # Add system message about the new video
        self.conversation_history.append({
            "role": "system",
            "content": f"The user has added a new viral video to analyze: '{video_summary['title']}'. "
                      f"This video demonstrates these viral elements: {video_summary['viral_elements'][:200]}..."
        })
        
        return True
    
    def set_brand_info(self, brand_info: str):
        """Set or update brand information"""
        self.brand_info = brand_info
        
        # Add system message about the brand
        self.conversation_history.append({
            "role": "system",
            "content": f"The user has provided information about their brand: {brand_info}"
        })
    
    def chat(self, user_message: str) -> str:
        """Chat with the AI about viral content strategies"""
        
        # Create context from analyzed videos
        video_context = ""
        if self.analyzed_videos:
            video_context = "You have knowledge of these viral videos:\n"
            for i, video in enumerate(self.analyzed_videos, 1):
                video_context += f"{i}. '{video['title']}' - Key viral elements: {video['viral_elements'][:100]}...\n"
        
        # Create brand context
        brand_context = ""
        if self.brand_info:
            brand_context = f"The user's brand information: {self.brand_info}\n"
        
        # Create system message
        system_message = f"""
        You are an expert viral marketing consultant who helps create viral content strategies.
        
        {brand_context}
        
        {video_context}
        
        Your goal is to help the user create viral content for their brand based on the analyzed videos.
        Be specific, actionable, and creative. Reference specific elements from the analyzed videos when relevant.
        """
        
        # Add user message to history
        self.conversation_history.append({
            "role": "user",
            "content": user_message
        })
        
        # Prepare messages for API call
        messages = [{"role": "system", "content": system_message}]
        
        # Add conversation history (limit to last 10 messages to save tokens)
        messages.extend(self.conversation_history[-10:])
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=messages,
                temperature=0.7,
                max_tokens=1000
            )
            
            assistant_message = response.choices[0].message.content
            
            # Add assistant response to history
            self.conversation_history.append({
                "role": "assistant",
                "content": assistant_message
            })
            
            return assistant_message
            
        except Exception as e:
            error_message = f"Error generating response: {str(e)}"
            self.conversation_history.append({
                "role": "system",
                "content": error_message
            })
            return error_message
    
    def get_conversation_history(self) -> List[Dict[str, str]]:
        """Get the conversation history"""
        return self.conversation_history
    
    def generate_content_plan(self) -> Dict[str, Any]:
        """Generate a comprehensive content plan based on analyzed videos and brand"""
        
        if not self.analyzed_videos:
            return {"error": "No videos have been analyzed yet"}
        
        if not self.brand_info:
            return {"error": "No brand information provided"}
        
        # Create context from analyzed videos
        video_summaries = ""
        for i, video in enumerate(self.analyzed_videos, 1):
            video_summaries += f"""
            VIDEO {i}: {video['title']}
            URL: {video['url']}
            VIRAL ELEMENTS: {video['viral_elements'][:200]}...
            HOOKS: {', '.join(video['hooks'][:3])}
            """
        
        prompt = f"""
        Based on these viral videos the user has analyzed:
        
        {video_summaries}
        
        And this brand information:
        {self.brand_info}
        
        Create a comprehensive 30-day content plan with:
        
        1. CONTENT PILLARS: 3-5 main themes to focus on
        2. WEEKLY SCHEDULE: What to post each day of the week
        3. VIRAL HOOKS: 10 specific hook ideas adapted for this brand
        4. CONTENT FORMATS: 5 specific formats that would work well
        5. HASHTAG STRATEGY: Platform-specific hashtag recommendations
        
        Make everything extremely specific to the brand and inspired by the analyzed viral videos.
        """
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=2000
            )
            
            content_plan = response.choices[0].message.content
            
            return {
                "success": True,
                "content_plan": content_plan
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to generate content plan: {str(e)}"
            }

# Complete workflow function
def create_viral_content(video_url: str, brand_info: str, platform: str, openai_api_key: str) -> Dict:
    """Complete pipeline: Video URL -> Transcript & Metadata -> Viral Content"""
    
    from video_transcript import process_video
    
    print("Step 1: Processing video...")
    video_data = process_video(video_url, openai_api_key)
    
    if not video_data.get("success"):
        return {"error": "Could not process video", "details": video_data}
    
    print("Step 2: Generating viral content...")
    generator = AIScriptGenerator(openai_api_key)
    
    # Analyze viral patterns
    print("Step 2.1: Analyzing viral patterns...")
    viral_patterns = generator.analyze_viral_patterns(video_data)
    
    # Generate content
    print("Step 2.2: Creating content...")
    result = generator.analyze_and_generate(
        video_data["transcript"], 
        brand_info, 
        platform, 
        video_data["metadata"]
    )
    
    # Generate hooks
    print("Step 2.3: Generating hooks...")
    hooks = generator.generate_quick_hooks(
        video_data["transcript"],
        count=5,
        metadata=video_data["metadata"]
    )
    
    # Combine all results
    result.update({
        "original_transcript": video_data["transcript"],
        "source_url": video_url,
        "metadata": video_data["metadata"],
        "hooks": hooks,
        "viral_patterns": viral_patterns.get("analysis", {}),
        "timestamp": import_datetime_if_needed()
    })
    
    return result

def import_datetime_if_needed():
    """Import datetime and return current time"""
    from datetime import datetime
    return datetime.now().isoformat()

# Usage examples
def main():
    """Example usage"""
    
    API_KEY = "your-openai-api-key"
    
    # Example: TikTok content
    result = create_viral_content(
        video_url="https://www.tiktok.com/@user/video/123456789",
        brand_info="Eco-friendly skincare brand targeting Gen Z women aged 18-25. Products: face serums, cleansers. Values: sustainability, self-care, authenticity.",
        platform="tiktok",
        openai_api_key=API_KEY
    )
    
    if result.get("success"):
        print("🎯 VIRAL ANALYSIS:")
        print(result["viral_analysis"])
        print("\n📝 MAIN SCRIPT:")
        print(result["main_script"])
        print("\n💡 VIRAL IDEAS:")
        print(result["viral_ideas"])
        print("\n🪝 HOOK IDEAS:")
        for i, hook in enumerate(result["hooks"], 1):
            print(f"{i}. {hook}")
        print("\n🔍 VIRAL PATTERNS:")
        print(json.dumps(result["viral_patterns"], indent=2))
    else:
        print("Error:", result.get("error"))
    
    # Example: Chat session
    print("\n\n===== CHAT SESSION EXAMPLE =====")
    chat_session = ViralContentChatSession(API_KEY)
    chat_session.set_brand_info("Eco-friendly skincare brand targeting Gen Z women aged 18-25.")
    chat_session.add_analyzed_video(result)
    
    response = chat_session.chat("Can you suggest 3 viral video ideas for my skincare brand based on the video I uploaded?")
    print("RESPONSE:", response)

if __name__ == "__main__":
    main()