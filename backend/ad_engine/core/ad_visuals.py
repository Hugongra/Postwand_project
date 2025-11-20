"""Visual prompt building and ad image generation."""

from models.image.controller import edit_image, png_to_base64_uri, improve_image
from .variations import VARIATIONS


def build_visual_prompt(ad_type, brand, copy_data, variation_idx):
    """Constructs the visual prompt for AI image generation using paragraph-style templates."""
    ad_variations = VARIATIONS.get(ad_type, VARIATIONS["product"])
    v = ad_variations[variation_idx % len(ad_variations)]
    
    brand_name = brand.get("name", "the brand")
    colors = brand.get("colors", {}).get("palette", [])[:2]
    
    # Extract brand features from existing structure
    brand_info = brand.get("brand_info", {})
    product_features = brand_info.get("product_features", {})
    core_features = product_features.get("core_features", [])
    usps = product_features.get("usps", [])
    
    prompt = v["prompt_template"].format(
        brand_name=brand_name,
        brand_name_product=f"{brand_name} product",
        headline=copy_data.get("headline", ""),
        features="\n- ".join(copy_data.get("features", [])),
        call_to_action=copy_data.get("call_to_action", ""),
        review_text=copy_data.get("review_text", ""),
        reviewer_name=copy_data.get("reviewer_name", ""),
        reviewer_title=copy_data.get("reviewer_title", ""),
        before_state=copy_data.get("before_state", ""),
        after_state=copy_data.get("after_state", ""),
        problem_statement=copy_data.get("problem_statement", ""),
        solution_headline=copy_data.get("solution_headline", ""),
        benefit_summary=", ".join(copy_data.get("benefit_summary", [])),
        question=copy_data.get("question", ""),
        competitor_reference=copy_data.get("competitor_reference", ""),
        key_difference=copy_data.get("key_difference", ""),
        generic_features=", ".join(["Slow", "Outdated", "Limited Features"]),
        brand_features=", ".join(core_features[:3] if core_features else usps[:3]),
        emotion_tone=copy_data.get("emotion_tone", "Confident, Bold"),
        color_palette=colors,
        font=v.get("font", "modern sans-serif"),
    )
    
    return prompt


def generate_ad_image(prompt, product_image):
    """Generate ad image from visual prompt and product image."""
    image_base64 = png_to_base64_uri(product_image)
    response = edit_image(
        model='openai', 
        prompt=prompt,
        aspect_ratio='1024x1024', 
        num_images=1, 
        images=image_base64
    )
    
    if not response.get('success'):
        raise Exception(f"Image generation failed: {response.get('error', 'Unknown error')}")
    
    return improve_image(response["images"])

