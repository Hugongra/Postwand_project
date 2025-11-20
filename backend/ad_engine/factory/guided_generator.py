"""Guided ad generation - stepwise user-driven mode."""

from ad_engine.core.ad_copy import generate_ad_copy
from ad_engine.core.ad_visuals import build_visual_prompt, generate_ad_image
from ad_engine.core.variations import get_variation_index, PROMPTS, RESPONSE_MODELS


def get_available_ad_types():
    """Get list of available ad types."""
    return list(PROMPTS.keys())


def generate_guided_copy(ad_type, brand_info, user_inputs=None, use_ai=True):
    """Generate copy either with AI or validate user manual inputs."""
    if use_ai:
        return generate_ad_copy(ad_type, brand_info)
    else:
        # User manually fills fields; just validate model
        model_cls = RESPONSE_MODELS[ad_type]
        return model_cls(**user_inputs).model_dump()


def finalize_guided_ad(ad_type, brand, copy_data):
    """Finalize ad with user-provided or AI-generated copy."""
    variation_idx = get_variation_index()
    
    visual_prompt = build_visual_prompt(
        ad_type, 
        brand, 
        copy_data, 
        variation_idx 
    )
    
    image = brand.get("image_urls", [])[0]
    final_image = generate_ad_image(visual_prompt, image)
    
    return {
        "visual_prompt": visual_prompt, 
        "image": final_image
    }

