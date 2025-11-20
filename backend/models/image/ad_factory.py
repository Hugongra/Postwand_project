import os
import sys
import json
import random
from datetime import datetime
from dotenv import load_dotenv

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env'))

# Import from new modular ad_engine structure
from ad_engine.core.ad_copy import generate_ad_copy
from ad_engine.core.ad_visuals import build_visual_prompt
from ad_engine.core.variations import PROMPTS, RESPONSE_MODELS, VARIATIONS, get_variation_index
from models.image.controller import edit_image, png_to_base64_uri, improve_image

# Re-export for backward compatibility
__all__ = [
    'generate_ad_copy',
    'build_visual_prompt', 
    'get_variation_index',
    'PROMPTS',
    'RESPONSE_MODELS',
    'VARIATIONS',
    'generate_ad_prompts',
    'generate_ad_image',
]

def generate_ad_prompts(ad_type, brand_info, variation_index=None, seed=None,
                        use_date_rotation=True, temperature=0.9, regenerate_copy=True):
    """Main ad prompt and copy generation factory."""
    if variation_index is None:
        variation_index = (seed % 11 if seed is not None else
                           get_variation_index() if use_date_rotation else 0)

    print(f"\n=== Generating {ad_type.upper()} ad for {brand_info.get('name')} (Variation {variation_index}) ===")

    copy_data = (
        generate_ad_copy(ad_type, brand_info, temperature)
        if regenerate_copy else
        brand_info.get('pre_generated_copy', {}).get(ad_type, {})
    )

    visual_prompt = build_visual_prompt(
        ad_type, brand_info.get('name', 'Brand'),
        brand_info.get('color_palette', '#4A90E2'),
        copy_data, variation_index, brand_info.get('product_image')
    )

    return {
        "copy_data": copy_data,
        "visual_prompt": visual_prompt,
        "variation_index": variation_index,
        "ad_type": ad_type,
        "temperature": temperature,
    }

def generate_ad_image(ad_type, brand_info, variation_index=0):
    """Generate ad copy and edit image with product."""
    result = generate_ad_prompts(ad_type, brand_info, variation_index)
    print("Editing image with product...")

    # Use edit_image with the product image
    product_image = brand_info.get('product_image')
    
    if not product_image or not os.path.exists(product_image):
        raise ValueError(f"Product image not found: {product_image}")
    
    print(f"Using product image: {product_image}")
    # Nano Banana needs image URLs, not base64
    # For local file, we need to convert to URL or use absolute path
    image_base64 = png_to_base64_uri(product_image)
    response = edit_image(
        model='nano_banana',
        prompt=result['visual_prompt'],
        aspect_ratio='4:5',
        num_images=1,
        images=[image_base64]  # Pass as data URI
    )
    
    
    print(f"Image URL: {response['images'][0]}")

    return response

def main():
    # Get the directory where this script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    

    northface_brand = {
        "name": "The North Face",
        "color_palette": "#000000, #FFFFFF, #E74C3C",
        "tone": "Adventurous, Bold, Authentic, Outdoor-Focused",
        "features": ["Weather Resistant", "Durable Construction", "Insulated", "Breathable Fabric", "Adventure Ready"],
        "usps": ["Never Stop Exploring", "Built for the Outdoors"],
        "audience": ["Outdoor Enthusiasts", "Hikers", "Adventure Seekers", "Nature Lovers"],
        "product_image": os.path.join(script_dir, "shopping.png"),
    }
    
    #brand = {
    #    "name": "Radiant Glow Skincare",
    #    "color_palette": "#FFE5E5, #FFC1CC, #FFFFFF, #E8B4B8",
    #    "tone": "Gentle, Nurturing, Confident, Science-Backed",
    #    "features": ["Dermatologist Tested", "Natural Ingredients", "Anti-Aging Formula", "Hydrating", "Non-Comedogenic"],
    #    "usps": ["Clinically Proven Results", "Clean Beauty Standards"],
    #    "audience": ["Skincare Enthusiasts", "Beauty Conscious", "Health-Focused Individuals", "Self-Care Advocates"],
    #    "product_image": os.path.join(script_dir, "skincare.png"),
    #}

    # Randomly select an ad type
    ad_types = ["product", "social_proof", "before_after", "problem_solution", "controversial_question", "comparison"]
   # ad_type = random.choice(ad_types)
    ad_type = "controversial_question"
    
    print(f"\n{'='*60}")
    print(f"Testing {ad_type.upper()} ad with AI-generated copy")
    print(f"{'='*60}\n")
    
    result = generate_ad_prompts(ad_type, northface_brand, variation_index=3, regenerate_copy=True)
    print("\n📝 Generated Copy:")
    print(json.dumps(result['copy_data'], indent=2, ensure_ascii=False))
    print("\n🎨 Visual Prompt:")
    print(result['visual_prompt'])
    
    # Generate the actual image
    print("\n🖼️  Generating image...")
    image_result = generate_ad_image(ad_type, northface_brand, variation_index=3)

    final_image = improve_image(image_result['images'])
    print(f"Final image: {final_image}")

if __name__ == "__main__":
    main()
