





# SIMPLE CHAT WITH STRUCTURED OUTPUTS - GROK API
from openai import OpenAI
import os
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from flask import session
import json

load_dotenv()

model = "grok-3-mini-beta"

grok_client = OpenAI(
    api_key=os.getenv('XAI_API_KEY'),
    base_url="https://api.x.ai/v1",
)

# Load system prompt from file
def load_system_prompt():
    try:
        with open('system_prompt.txt', 'r', encoding='utf-8') as file:
            return file.read()
    except FileNotFoundError:
        print("Warning: system_prompt.txt not found. Using default prompt.")
        return "You are a helpful social media content assistant."

# Load the system prompt once at startup
SYSTEM_PROMPT = load_system_prompt()

# Define Pydantic models for structured output
class SocialMediaPost(BaseModel):
    id: int = Field(description="Unique identifier for the post option")
    content: str = Field(description="The main text content without hashtags")
    content_with_hashtags: str = Field(description="Full content including hashtags")
    hashtags: List[str] = Field(description="List of hashtags for this post")
    platform: str = Field(description="Target platform (facebook, instagram, twitter, etc.)")
    tone: Optional[str] = Field(description="Tone of the post (professional, casual, enthusiastic, etc.)", default=None)
    call_to_action: Optional[str] = Field(description="Call to action if included", default=None)

class ContentSuggestion(BaseModel):
    tip: str = Field(description="A tip or suggestion for content improvement")
    category: str = Field(description="Category of the suggestion (engagement, timing, hashtags, etc.)")

class StructuredChatResponse(BaseModel):
    posts: List[SocialMediaPost] = Field(description="List of social media post options")
    suggestions: Optional[List[ContentSuggestion]] = Field(description="Additional tips and suggestions", default=[])
    all_hashtags: List[str] = Field(description="All unique hashtags from all posts")
    summary: Optional[str] = Field(description="Brief summary of the content created", default=None)

# Simple chat service class with memory
class TextChatService:
    def __init__(self):
        self.conversations = {}  # Store conversations by user_id
    
    def get_conversation_history(self, user_id):
        return self.conversations.get(user_id, [])
    
    def add_to_conversation(self, user_id, role, content):
        if user_id not in self.conversations:
            self.conversations[user_id] = []
        
        self.conversations[user_id].append({
            "role": role,
            "content": content
        })
        
        # Keep only last 10 messages to prevent too long context
        if len(self.conversations[user_id]) > 10:
            self.conversations[user_id] = self.conversations[user_id][-10:]
    
    def clear_conversation(self, user_id):
        if user_id in self.conversations:
            self.conversations[user_id] = []

chat_service = TextChatService()

def send_chat_message(message, conversation_context=None, mode="ask"):
    """
    Send a chat message with different modes
    
    Args:
        message: User's message
        conversation_context: Previous conversation context
        mode: "write_post" for structured content creation, "ask" for conversational (default: "ask")
    """
    try:
       
        user_id = session.get('user_id')
        
        # Get conversation history
        history = chat_service.get_conversation_history(user_id)
        
        # Choose system prompt based on mode
        if mode == "write_post":
            system_prompt = """You are a helpful social media content assistant.
            When creating social media content:
            - Always provide 2-3 different post options with varying tones or approaches
            - Include relevant hashtags (3-5 per post)
            - Consider platform-specific best practices
            - Add actionable tips when relevant
            - Make content engaging and shareable
            - Keep content in single paragraph format without unnecessary line breaks
            - Dont use em dashes, parenthesis, quotes, asterisks, or other punctuation.
            """
        else:  # mode == "ask"
            system_prompt = """You are a helpful and professional social media content expert. 
            You can have normal conversations and provide advice about social media, content strategy, 
            marketing tips, or answer any questions. Be conversational and helpful.
            You have access to the conversation history, so you can reference previous discussions.
            Dont use em dashes, parenthesis, quotes, asterisks, or other punctuation or emojis.
            """
        
        # Build messages array
        messages = [
            {"role": "system", "content": system_prompt}
        ]
        
        # Add conversation history
        messages.extend(history)
        
        # Add current user message
        messages.append({"role": "user", "content": message})
        
        if mode == "write_post":
            # Use structured output with response_format
            completion = grok_client.beta.chat.completions.parse(
                model=model,  # Must use a model that supports structured outputs
                messages=messages,
                temperature=0.7,
                max_tokens=4000,
                response_format=StructuredChatResponse,
            )
            
            # Get the parsed response
            parsed_response = completion.choices[0].message.parsed
            
            # Convert Pydantic model to dict for JSON serialization
            structured_data = parsed_response.dict() if parsed_response else {}
            
            # Save conversation
            chat_service.add_to_conversation(user_id, "user", message)
            # Save a summary of AI response for context
            ai_summary = f"Created {len(structured_data.get('posts', []))} post options"
            chat_service.add_to_conversation(user_id, "assistant", ai_summary)
            
            return {
                "success": True,
                "message": structured_data.get('summary', 'Content created successfully'),
                "structured_content": structured_data
            }
        else:  # mode == "ask"
            # Regular conversational response
            completion = grok_client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=0.7,
                max_tokens=4000
            )
            
            ai_response = completion.choices[0].message.content
            
            # Save conversation
            chat_service.add_to_conversation(user_id, "user", message)
            chat_service.add_to_conversation(user_id, "assistant", ai_response)
            
            return {
                "success": True,
                "message": ai_response
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": "Chat failed",
            "details": str(e)
        }

def generate_content_from_chat(prompt, content_type="post", platform="linkedin"):
    """
    Generate content with guaranteed structured output
    """
    try:
     
       
        
        # Platform-specific requirements
        platform_specs = {
            "facebook": {"char_limit": 3060, "optimal": 1000, "hashtag_limit": 5},
            "instagram": {"char_limit": 2200, "optimal": 150, "hashtag_limit": 5},
            "linkedin": {"char_limit": 4000, "optimal": 1500, "hashtag_limit": 2}
        }
        
        specs = platform_specs.get(platform, platform_specs["facebook"])
        
        # Enhanced prompt for platform-specific content
        enhanced_prompt = f"""Create {content_type} for {platform} based on: {prompt}
        
        Platform requirements:
        - Character limit: {specs['char_limit']} (optimal: {specs['optimal']})
        - Hashtag limit: {specs['hashtag_limit']}
        
        Create 3 different options with varying tones:
        1. Professional/Informative
        2. Casual/Friendly
        3. Enthusiastic/Engaging
        
        Include appropriate hashtags and calls-to-action for each."""
        
        completion = grok_client.beta.chat.completions.parse(
            model=model,
            messages=[
                {
                    "role": "system", 
                    "content": "You are a social media content expert. Create engaging, platform-optimized content."
                },
                {"role": "user", "content": enhanced_prompt}
            ],
            temperature=0.8,
            max_tokens=3000,
            response_format=StructuredChatResponse,
        )
        
        # Get the parsed response
        parsed_response = completion.choices[0].message.parsed
        structured_data = parsed_response.dict() if parsed_response else {}
        
        # Ensure platform is set correctly for all posts
        if structured_data.get('posts'):
            for post in structured_data['posts']:
                post['platform'] = platform
        
        return {
            "success": True,
            "data": {
                "content": structured_data.get('summary', 'Content generated'),
                "structured_content": structured_data,
                "platform": platform,
                "content_type": content_type,
                "total_tokens": completion.usage.total_tokens if hasattr(completion, 'usage') else 0
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": "Failed to generate content",
            "details": str(e)
        }

def send_chat_message_stream(message, conversation_context=None, mode="ask"):
    """
    Stream chat responses using Server-Sent Events - REAL streaming
    """
    try:
        user_id = session.get('user_id')
        
        # Get conversation history
        history = chat_service.get_conversation_history(user_id)
        
        # Choose system prompt based on mode
        if mode == "write_post":
            system_prompt = """You are a helpful social media content assistant.
            When creating social media content:
            - Always provide 2-3 different post options with varying tones or approaches
            - Include relevant hashtags (3-5 per post)
            - Consider platform-specific best practices
            - Add actionable tips when relevant
            - Make content engaging and shareable
            - Keep content in single paragraph format without unnecessary line breaks
            - Dont use em dashes, parenthesis, quotes, asterisks, or other punctuation.
            """
        else:  # mode == "ask"
            system_prompt = """You are a helpful and professional social media content expert. 
            You can have normal conversations and provide advice about social media, content strategy, 
            marketing tips, or answer any questions. Be conversational and helpful.
            You have access to the conversation history, so you can reference previous discussions.
            Dont use em dashes, parenthesis, quotes, asterisks, or other punctuation or emojis.
            """
        
        # Build messages array
        messages = [
            {"role": "system", "content": system_prompt}
        ]
        
        # Add conversation history
        messages.extend(history)
        
        # Add current user message
        messages.append({"role": "user", "content": message})
        
        # Stream the response
        def generate():
            full_response = ""
            
            try:
                stream = grok_client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=0.7,
                    max_tokens=4000,
                    stream=True
                )
                
                for chunk in stream:
                    if chunk.choices[0].delta.content is not None:
                        content = chunk.choices[0].delta.content
                        full_response += content
                        
                        # Send each chunk immediately
                        yield f"data: {json.dumps({'content': content, 'type': 'chunk'})}\n\n"
                
                # Save conversation after streaming is complete
                chat_service.add_to_conversation(user_id, "user", message)
                chat_service.add_to_conversation(user_id, "assistant", full_response)
                
                # Send completion signal
                yield f"data: {json.dumps({'type': 'complete', 'full_response': full_response})}\n\n"
                
            except Exception as e:
                yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
        
        return generate()
        
    except Exception as e:
        def error_generator():
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
        return error_generator()


