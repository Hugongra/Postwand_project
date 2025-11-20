from models.chat.controller import ChatController
from .variations import AD_STRATEGIES, RESPONSE_MODELS


def generate_ad_copy(ad_type, brand, temperature=0.7):
    """Generate ad copy using ChatGPT structured response."""
    chat = ChatController.chat_structured("openai")
    strategy = AD_STRATEGIES.get(ad_type, AD_STRATEGIES["product"])
    model = RESPONSE_MODELS.get(ad_type, RESPONSE_MODELS["product"])

    # Extract brand data - brand_info contains all the nested data
    brand_info = brand.get('brand_info', {})
    company = brand_info.get('company_details', {})
    audience = brand_info.get('audience', {})
    tone = brand_info.get('tone', {})
    features = brand_info.get('product_features', {})
    
    # Build tone string from all tone components
    tone_list = tone.get('tone_emotion', []) + tone.get('brand_character', []) + tone.get('language_style', [])
    
    system_prompt = f"""You are an expert marketing copywriter specializing in high-converting ad copy.
        BRAND: {brand.get('name')}
        INDUSTRY: {company.get('industry_type', {}).get('category', '')} - {company.get('industry_type', {}).get('subcategory', '')}
        DESCRIPTION: {company.get('company_description', '')}
        TONE: {', '.join(tone_list)}
        AUDIENCE: {', '.join(audience.get('professions', []))} | Age: {audience.get('age_range', '')} | Gender: {audience.get('gender', '')}
        KEY FEATURES: {', '.join(features.get('key_features', [])[:5])}
        UNIQUE SELLING POINTS: {', '.join(features.get('unique_selling_points', [])[:5])}
        BENEFITS: {', '.join(features.get('benefits', [])[:5])}

        RULES:
        1. Keep ALL text extremely short and punchy for ad display
        2. NEVER use dashes (—, –, -). Use periods, commas, or exclamation points
        3. Follow word count limits in field descriptions
        4. Use vivid imagery, emotional hooks, and benefit-led messaging
        5. For backgrounds: Consumer products need real people in natural settings. B2B/SaaS use professional environments."""

    user_prompt = f"""
        Create ad copy using the "{strategy['name']}" strategy for the brand: {brand.get('name')}.
        GOAL: {strategy['goal']}
        APPROACH: {strategy['approach']}
    """

    response = chat.send(
        system_prompt, 
        user_prompt, 
        model, 
        temperature=temperature, 
        model="gpt-5-mini", 
        max_tokens=3000
    )
    return response.get("content").model_dump()

