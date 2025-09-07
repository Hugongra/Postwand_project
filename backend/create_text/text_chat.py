






# SIMPLE CHAT WITH STRUCTURED OUTPUTS - GROK API
from openai import OpenAI
import os
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from flask import session
from usage.token_usage import check_grok_limit, update_grok_usage

load_dotenv()

model = "grok-3-mini-beta"

grok_client = OpenAI(
    api_key=os.getenv('XAI_API_KEY'),
    base_url="https://api.x.ai/v1",
)

# Load system prompt from file
def load_system_prompt(mode):
    current_dir = os.path.dirname(os.path.abspath(__file__))
    filename = os.path.join(current_dir, f'system_prompt_{mode}.txt')
    try:
        with open(filename, 'r', encoding='utf-8') as file:
            template = file.read()
        return template
    except FileNotFoundError:
        print(f"Warning: {filename} not found. Using default prompt.")
        if mode == "ask":
            return "You are a helpful social media content expert."
        else:
            return "You are a helpful social media content assistant."

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
    
    def add_to_conversation(self, user_id, role, content, structured_posts=None):
        if user_id not in self.conversations:
            self.conversations[user_id] = []
        
        message_data = {
            "role": role,
            "content": content
        }
        
        # Add structured posts if provided
        if structured_posts:
            message_data["structured_posts"] = structured_posts
        
        self.conversations[user_id].append(message_data)
        
        # Keep only last 10 messages to prevent too long context
        if len(self.conversations[user_id]) > 10:
            self.conversations[user_id] = self.conversations[user_id][-10:]
    
    def clear_conversation(self, user_id):
        if user_id in self.conversations:
            self.conversations[user_id] = []

chat_service = TextChatService()

def send_chat_message(message, conversation_context=None, mode="ask", platforms=None):
    """
    Send a chat message with different modes
    
    Args:
        message: User's message
        conversation_context: Previous conversation context
        mode: "write_post" for structured content creation, "ask" for conversational (default: "ask")
        platforms: List of social media platforms for write_post mode (e.g., ["instagram", "linkedin"])
    """
    try:
       
        user_id = session.get('user_id')
        
        # Check if user is over Grok token limit
        if check_grok_limit(user_id):
            return {
                "success": False,
                "error": "Monthly Grok token limit exceeded",
                "details": "You have reached your monthly Grok token usage limit. Please upgrade your plan to continue."
            }
        
        # Get conversation history
        history = chat_service.get_conversation_history(user_id)
        
        # Load system prompt based on mode
        system_prompt = load_system_prompt(mode)
        
        # Add platform-specific instructions for write_post mode
        if mode == "write_post" and platforms:
            platform_instruction = f"\n\nIMPORTANT: Create exactly ONE post for each of these platforms: {', '.join(platforms)}. Each post should be optimized specifically for that platform's audience and format."
            system_prompt += platform_instruction
        
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
            
            # Extract token usage and update database
            total_tokens = completion.usage.total_tokens if hasattr(completion, 'usage') else None
            if total_tokens:
                update_grok_usage(user_id, total_tokens)
            
            # Save conversation
            chat_service.add_to_conversation(user_id, "user", message)
            # Save a summary of AI response for context
            posts_count = len(structured_data.get('posts', []))
            platforms_mentioned = ', '.join(set(post.get('platform', '') for post in structured_data.get('posts', [])))
            ai_summary = f"Created {posts_count} post(s) for platforms: {platforms_mentioned}"
            # Save assistant response with structured posts data
            chat_service.add_to_conversation(user_id, "assistant", ai_summary, structured_data.get('posts'))
            
            return {
                "success": True,
                "message": structured_data.get('summary', 'Content created successfully'),
                "structured_content": structured_data,
                "tokens_used": total_tokens
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
            
            # Extract token usage and update database
            total_tokens = completion.usage.total_tokens if hasattr(completion, 'usage') else None
            if total_tokens:
                update_grok_usage(user_id, total_tokens)
            
            # Save conversation
            chat_service.add_to_conversation(user_id, "user", message)
            chat_service.add_to_conversation(user_id, "assistant", ai_response)
            
            return {
                "success": True,
                "message": ai_response,
                "tokens_used": total_tokens
            }

    except Exception as e:
        return {
            "success": False,
            "error": "Chat failed",
            "details": str(e)
        }

def handle_text_action(action, content, platform, user_input=""):
    """
    Handle text actions like improve, expand, shorten, or ask
    """
    try:
        user_id = session.get('user_id')
        
        # Check if user is over Grok token limit
        if check_grok_limit(user_id):
            return {
                "success": False,
                "error": "Monthly Grok token limit exceeded",
                "details": "You have reached your monthly Grok token usage limit. Please upgrade your plan to continue."
            }
        
        # Define action prompts
        action_prompts = {
            "Improve": f"Improve this {platform} post to make it more engaging and effective. Keep the same general message but enhance the writing quality, tone, and impact:",
            "Expand": f"Expand this {platform} post with more details, examples, or context. Make it more comprehensive while maintaining the original message:",
            "Shorten": f"Make this {platform} post shorter and more concise while keeping the key message and impact. Remove unnecessary words:",
            "Ask": f"Modify this {platform} post based on this specific request: {user_input}. Here's the current post:"
        }
        
        if action not in action_prompts:
            return {"success": False, "error": "Invalid action"}
        
        if not content.strip():
            return {"success": False, "error": "No content to modify"}
        
        # For Ask action, require user input
        if action == "Ask" and not user_input.strip():
            return {"success": False, "error": "Please provide instructions for what you want to change"}
        
        # Build the prompt
        prompt = f"{action_prompts[action]}\n\n{content}"
        
        # Simple completion request
        completion = grok_client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": f"You are a {platform} content expert. Return only the modified post content, no explanations or extra text. IMPORTANT: Always respond in the same language that the user writes in. If the user writes in Spanish, respond in Spanish. If the user writes in English, respond in English. Match the user's language exactly."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=5000
        )
        
        modified_content = completion.choices[0].message.content.strip()
        
        # Extract token usage and update database
        total_tokens = completion.usage.total_tokens if hasattr(completion, 'usage') else None
        if total_tokens:
            update_grok_usage(user_id, total_tokens)
        
        return {
            "success": True,
            "modified_content": modified_content,
            "tokens_used": total_tokens
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": "Action failed",
            "details": str(e)
        }



