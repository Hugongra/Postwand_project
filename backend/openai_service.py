from openai import OpenAI
import os
from dotenv import load_dotenv
import json
from pydantic import BaseModel, Field
from typing import List
from rate_limiter import user_rate_limit
from brand_service import get_brand_profile
from flask import session
from usage.token_usage import check_token_limit, update_token_usage

# Load environment variables
load_dotenv()

#gpt-4-turbo-preview
#grok-3-mini-latest

MODEL = "grok-3-mini-latest"


client = OpenAI(
    api_key=os.getenv('XAI_API_KEY'),
    base_url="https://api.x.ai/v1",
)



SYSTEM_PROMPT = """

You are postwand, a skilled social media content AI creator for social media platforms. Your job is to craft posts that:

Follow the following instructions clearly:
1. Sound human, not robotic—write.
2. Add spacing between sentences for an easy read.
3. Add line breaks to create more spacing between paragraphs.
4. Dont use em dashes, parenthesis, quotes, asterisks, or other punctuation.
5. Do not include the character count in the generated posts.

"""

def get_platform_requirements(platform):
    requirements = {
        "x": {
            "max_length": 280,
            "optimal_length": 200,
            "hashtag_limit": 2,
            "style": "concise, punchy, conversation-starter"
        },
        "facebook": {
            "max_length": 500,
            "optimal_length": 100,
            "hashtag_limit": 3,
            "style": "informative, friendly, community-focused"
        },
        "instagram": {
            "max_length": 150,
            "optimal_length": 125,
            "hashtag_limit": 15,
            "style": "visual-focused, emoji-friendly, hashtag-heavy"
        },
        "linkedin": {
            "max_length": 500,
            "optimal_length": 140,
            "hashtag_limit": 3,
            "style": "professional, industry-focused, thought leadership"
        },
        "email": {
            "max_length": 100,
            "optimal_length": 50,
            "hashtag_limit": 0,
            "style": "concise, punchy, clear call-to-action"
        },
        "threads": {
            "max_length": 200,
            "optimal_length": 100,
            "hashtag_limit": 2,
            "style": "casual, engaging, conversational"
        },
        "blog": {
            "max_length": 10000,
            "optimal_length": 2000,
            "hashtag_limit": 0,
            "style": "informative, detailed, value-driven"
        },
        "youtube": {
            "max_length": 400,
            "optimal_length": 200,
            "hashtag_limit": 15,
            "style": "SEO-optimized, informative, keyword-rich"
        }
    }
    return requirements.get(platform.lower(), requirements["facebook"])


def generate_user_prompt(topic, platform, tone, brand):
    platform = get_platform_requirements(platform)

    brand = get_brand_profile(brand)
    
    prompt = f"""Create a {platform} post based on the following prompt: {topic}.
            Tone: {tone}
            Maximum length: {platform['max_length']} characters
            Optimal length: {platform['optimal_length']} characters
            Style: {platform['style']}

            Consider these elements:
            1. Platform-specific features and best practices for {platform}
            2. Appropriate hashtags (limit: {platform.get('hashtag_limit', 3)})
            3. Engaging hooks and calls to action
            4. Current trends and best practice
            
            """
    
    if brand:
        prompt += f"""
        The post has to follow the brand guidelines of the user. The brand information is the following:
        Name: {brand['website_url']}
        Description: {brand['description']}
        Logo: {brand['logo']}
        Color pallete: {brand['colors']}
        Purpose: {brand['brand_info']['purpose']}
        
        Target Audience:
        - Gender: {brand['brand_info']['audience']['gender']}
        - Age Range: {brand['brand_info']['audience']['age_range']} 
        - Target Groups: {', '.join(brand['brand_info']['audience']['professions'])}
        - Market Type: {brand['brand_info']['audience']['consumer_business_industry']}
        
        Tone & Voice:
        - Emotional Tone: {', '.join(brand['brand_info']['tone_emotion'])}
        - Language Style: {', '.join(brand['brand_info']['language_style'])}
        - Brand Character: {', '.join(brand['brand_info']['brand_character'])}
        
        Key Messaging:
        - Taglines: {', '.join(brand['brand_info']['headers_taglines']['taglines'])}
        - Main Heading: {brand['brand_info']['headers_taglines']['main_heading']}
        """
        
    #Generate 3 unique variations of the post.
    return prompt    




  



@user_rate_limit(limit=10, period=60)  # 10 AI generation requests per minute
def generate_post(topic, platform=None, tone=None, brand=None):
    try:
        user_id = session.get('user_id')
        
        # Check if user is over token limit
        if user_id and check_token_limit(user_id):
            return {
                "success": False,
                "error": "Monthly token limit exceeded",
                "details": "You have reached your monthly token usage limit. Please upgrade your plan to continue."
            }
            
        completion = client.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT
                },
                {
                    "role": "user",
                    "content": generate_user_prompt(topic, platform, tone, brand)
                }
            ],
            temperature=0.9,
            max_tokens=500,
            presence_penalty=0.2,
            frequency_penalty=0.2
        )

        response = completion.choices[0].message.content
        # Split by double newline and remove quotation marks from each post
        posts = [post.strip().strip('"').strip("'") for post in response.split('\n\n') if post.strip()]
        
        # Extract token usage
        total_tokens = completion.usage.total_tokens if hasattr(completion, 'usage') else None
        
        # Update token usage in database
        if user_id and total_tokens:
            update_token_usage(user_id, total_tokens)

        return {
            "success": True,
            "data": {
                "suggestions": posts,
                "platform": platform,
                "tone": tone,
                "topic": topic,
                "total_tokens": total_tokens
            }
        }

    except Exception as e:
        return {
            "success": False,
            "error": "Failed to generate posts",
            "details": str(e)
        }

def generate_hashtags(topic, platform='facebook', count=5):
    try:
        user_id = session.get('user_id')
        
        # Check if user is over token limit
        if user_id and check_token_limit(user_id):
            return {
                "success": False,
                "error": "Monthly token limit exceeded",
                "details": "You have reached your monthly token usage limit. Please upgrade your plan to continue."
            }
            
        completion = client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {
                    "role": "system",
                    "content": "You are a social media hashtag expert. Generate relevant, trending hashtags for the given topic."
                },
                {
                    "role": "user",
                    "content": f"Generate {count} relevant hashtags for a {platform} post about {topic}. Focus on trending and high-impact hashtags."
                }
            ],
            temperature=0.6,
            max_tokens=200
        )

        hashtags = [
            tag for tag in completion.choices[0].message.content.split('\n')
            if tag.startswith('#')
        ][:count]
        
        # Extract token usage
        total_tokens = completion.usage.total_tokens if hasattr(completion, 'usage') else None
        
        # Update token usage in database
        if user_id and total_tokens:
            update_token_usage(user_id, total_tokens)

        return {
            "success": True,
            "data": {
                "hashtags": hashtags,
                "platform": platform,
                "topic": topic,
                "total_tokens": total_tokens
            }
        }

    except Exception as e:
        return {
            "success": False,
            "error": "Failed to generate hashtags",
            "details": str(e)
        } 
    

    # New function to improve an existing post
@user_rate_limit(limit=15, period=60)  # 10 AI generation requests per minute
def improve_post(original_post, platform='facebook', tone='friendly'):
    """Take an existing post and make it more engaging and natural."""
    try:
        user_id = session.get('user_id')
        
        # Check if user is over token limit
        if user_id and check_token_limit(user_id):
            return {
                "success": False,
                "error": "Monthly token limit exceeded",
                "details": "You have reached your monthly token usage limit. Please upgrade your plan to continue."
            }
            
        req = get_platform_requirements(platform)
        prompt = f"""Here's a {platform} post: '{original_post}'
Improve it to:
- Fit {platform}'s style ({req['style']})
- Stay under {req['max_length']} characters
- Match a {tone} tone
- Sound human and conversational
- Add up to {req['hashtag_limit']} relevant hashtags
- Boost engagement with a hook or call to action if it fits
"""

        completion = client.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.9,
            max_tokens=400,
            presence_penalty=0.2,
            frequency_penalty=0.2
        )

        improved_post = completion.choices[0].message.content.strip()
        
        # Extract token usage
        total_tokens = completion.usage.total_tokens if hasattr(completion, 'usage') else None
        
        # Update token usage in database
        if user_id and total_tokens:
            update_token_usage(user_id, total_tokens)

        return {
            "success": True,
            "data": {
                "original": original_post,
                "improved": improved_post,
                "platform": platform,
                "tone": tone,
                "total_tokens": total_tokens
            }
        }

    except Exception as e:
        return {
            "success": False,
            "error": "Failed to improve post",
            "details": str(e)
        }
    



   
# Define Pydantic model for Grok-2 structured output
class PostVariations(BaseModel):
    variations: List[str] = Field(description="An array of unique social media post variations")

def generate_post_variations_grok(topic, platform='facebook', tone='professional', content_type='post', num_variations=10):
    """
    Generate multiple variations of a social media post using Grok-2 with structured parsing.
    
    Args:
        topic (str): The topic of the post
        platform (str): Social media platform (facebook, twitter, instagram, linkedin)
        tone (str): Desired tone of the post (professional, casual, humorous, etc.)
        content_type (str): Type of content (post, caption, etc.)
        num_variations (int): Number of variations to generate (default: 10)
    
    Returns:
        dict: Dictionary containing success status and array of post variations
    """
    try:
        user_id = session.get('user_id')
        
        # Check if user is over token limit
        if user_id and check_token_limit(user_id):
            return {
                "success": False,
                "error": "Monthly token limit exceeded",
                "details": "You have reached your monthly token usage limit. Please upgrade your plan to continue."
            }
            
        # Get platform-specific requirements
        requirements = get_platform_requirements(platform)
        
        # Create a user prompt requesting variations
        user_prompt = f"""Create {num_variations} unique variations of a {platform} {content_type} about {topic}.
        
Tone: {tone}
Maximum length: {requirements['max_length']} characters
Style: {requirements['style']}

Return exactly {num_variations} distinct variations, with different angles, hooks, and phrasing.

Consider:
1. Platform-specific features and best practices for {platform}
2. Appropriate hashtags (limit: {requirements.get('hashtag_limit', 3)})
3. Engaging hooks and calls to action
4. Current trends and best practices
"""
        
        # Make API call to Grok-2 using the parse method with a Pydantic model
        completion = client.beta.chat.completions.parse(
            model="grok-2-latest",
            messages=[
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT
                },
                {
                    "role": "user",
                    "content": user_prompt
                }
            ],
            response_format=PostVariations,
        )

        # Access the parsed response
        parsed_response = completion.choices[0].message.parsed
        variations = parsed_response.variations
        print(completion)
        # Extract token usage
        total_tokens = completion.usage.total_tokens if hasattr(completion, 'usage') else None
        
        # Update token usage in database
        if user_id and total_tokens:
            update_token_usage(user_id, total_tokens)
        
        return {
            "success": True,
            "data": {
                "variations": variations,
                "count": len(variations),
                "total_tokens": total_tokens
            }
        }

    except Exception as e:
        return {
            "success": False,
            "error": "Failed to generate post variations with Grok-2",
            "details": str(e)
        }
