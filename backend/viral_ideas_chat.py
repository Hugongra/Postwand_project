import anthropic
from typing import Dict, List, Generator, Optional
import os
from dotenv import load_dotenv
from flask import session, Response, jsonify, request
from video_transcript import VideoTranscriber
from database import get_supabase_client
from datetime import datetime, timezone
from usage.token_usage import check_claude_limit, update_claude_usage

load_dotenv()

claude_api_key = os.getenv("CLAUDE_API_KEY")
supabase = get_supabase_client()

class ClaudeChatbot:
    def __init__(self, system_prompt: str):
        """Initialize chatbot with API key and system prompt."""
        self.client = anthropic.Anthropic(api_key=claude_api_key)
        self.system_prompt = system_prompt
        self.conversations: Dict[str, List[dict]] = {}
        
    def chat(self, user_id: str, message: str) -> str:
        """Send a message and get a response, maintaining conversation history."""
        # Check if user is over Claude token limit
        if check_claude_limit(user_id):
            raise Exception("Monthly Claude token limit exceeded. Please upgrade your plan to continue.")
        
        if user_id not in self.conversations:
            self.conversations[user_id] = []
        
        history = self.conversations[user_id]
        
        # Keep only last 20 messages to prevent token overflow
        if len(history) > 20:
            history = history[-20:]
        
        # Make API call
        response = self.client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1000,
            system=self.system_prompt,
            messages=history + [{"role": "user", "content": message}]
        )
        
        # Extract token usage and update database
        input_tokens = response.usage.input_tokens if hasattr(response, 'usage') else 0
        output_tokens = response.usage.output_tokens if hasattr(response, 'usage') else 0
        total_tokens = input_tokens + output_tokens
        
        if total_tokens > 0:
            update_claude_usage(user_id, total_tokens)
        
        # Update conversation history
        history.append({"role": "user", "content": message})
        history.append({"role": "assistant", "content": response.content[0].text})
        self.conversations[user_id] = history
        
        return response.content[0].text
    
    def stream_chat(self, user_id: str, message: str) -> Generator[str, None, None]:
        """Stream a message response, maintaining conversation history."""
        # Check if user is over Claude token limit
        if check_claude_limit(user_id):
            yield "Error: Monthly Claude token limit exceeded. Please upgrade your plan to continue."
            return
        
        if user_id not in self.conversations:
            self.conversations[user_id] = []
        
        history = self.conversations[user_id]
        
        # Keep only last 20 messages to prevent token overflow
        if len(history) > 20:
            history = history[-20:]
        
        # Add user message to history
        history.append({"role": "user", "content": message})
        
        # Collect the full response for history and token counting
        full_response = ""
        
        # Make streaming API call
        with self.client.messages.stream(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1000,
            system=self.system_prompt,
            messages=history
        ) as stream:
            for chunk in stream:
                if chunk.type == "content_block_delta" and chunk.delta.type == "text":
                    full_response += chunk.delta.text
                    yield chunk.delta.text
            
            # Get token usage from the stream
            final_message = stream.get_final_message()
            if final_message and hasattr(final_message, 'usage'):
                input_tokens = final_message.usage.input_tokens
                output_tokens = final_message.usage.output_tokens
                total_tokens = input_tokens + output_tokens
                
                if total_tokens > 0:
                    update_claude_usage(user_id, total_tokens)
        
        # Update conversation history with complete response
        history.append({"role": "assistant", "content": full_response})
        self.conversations[user_id] = history




def create_prompt(brain_data: dict) -> str:
    """
    Create a text prompt from processed brain data JSON.
    Handles folder-structured video data.
    """
    prompt_parts = []
    
    # Add video transcripts from brain_data
    if 'videos' in brain_data:
        prompt_parts.append("=== ANALYZED VIDEO CONTENT ===")
        for video_id, video_data in brain_data['videos'].items():
            prompt_parts.append(f"Video: {video_data.get('title', 'Unknown')}")
            prompt_parts.append(f"URL: {video_data.get('url', '')}")
            prompt_parts.append(f"Transcript: {video_data.get('transcript', '')[:500]}...")
            prompt_parts.append("---")
    
    # Add instructions
    prompt_parts.append("""
=== YOUR ROLE ===
You are a viral content expert who helps create engaging social media content based on analyzed video content.

Based on the analyzed content above, help generate viral content ideas that are:
- Creative and engaging
- Platform-appropriate (TikTok, Instagram, Facebook, LinkedIn, Twitter)
- Inspired by the analyzed video content and trends
- Specific and actionable
- Likely to generate high engagement

Focus on current trends, proven engagement tactics, and content formats that perform well.
When suggesting ideas, reference specific insights from the analyzed videos and explain why they could go viral.
""")
    
    return "\n".join(prompt_parts)




def initialize_chat(user_id):
    """Initialize chat with brain data from whiteboard if available."""
    
    
    data = request.get_json()
    if not data or 'message' not in data:
        return jsonify({"error": "No message provided"}), 400
    
    message = data['message']
    whiteboard_name = data.get('whiteboardName', 'Untitled Whiteboard')

    # Check if user is over Claude token limit
    if check_claude_limit(user_id):
        return jsonify({
            "error": "Monthly Claude token limit exceeded",
            "details": "You have reached your monthly Claude token usage limit. Please upgrade your plan to continue."
        }), 429

    try:
        result = supabase.table('viral_chat_whiteboards').select('data_info').eq('name', whiteboard_name).eq('user_id', user_id).execute()
        if result.data:
            brain_data = result.data[0]['data_info']
        else:
            brain_data = {}
    except Exception as e:
        print(f"Error getting brain data: {str(e)}")
        brain_data = {}
    
        # Create system prompt
    system_prompt = create_prompt(brain_data)
    
    # Get chat response
    bot = ClaudeChatbot(system_prompt)
    try:
        response = bot.chat(user_id, message)
        return jsonify({"response": response})
    except Exception as e:
        if "token limit exceeded" in str(e):
            return jsonify({
                "error": "Monthly Claude token limit exceeded",
                "details": str(e)
            }), 429
        return jsonify({"error": str(e)}), 500


def connect_to_chat():
    """Connect whiteboard to chat by processing all videos and documents"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({"error": "User not authenticated"}), 401
        
        data = request.get_json()
        if not data or 'whiteboard_name' not in data:
            return jsonify({"error": "Whiteboard name is required"}), 400
        
        whiteboard_name = data['whiteboard_name']
        
        # Get whiteboard from database
        result = supabase.table('viral_chat_whiteboards').select('*').eq('name', whiteboard_name).eq('user_id', user_id).execute()
        
        if not result.data:
            return jsonify({"error": "Whiteboard not found"}), 404
        
        whiteboard = result.data[0]
        brain_data = whiteboard.get('brain_data', {})
        
        # Create system prompt with brain data
        system_prompt = create_prompt(brain_data)
        
        return jsonify({
            "success": True,
            "message": "Connected to chat successfully",
            "whiteboard_name": whiteboard_name
        }), 200
        
    except Exception as e:
        print(f"Error connecting to chat: {str(e)}")
        return jsonify({"error": str(e)}), 500