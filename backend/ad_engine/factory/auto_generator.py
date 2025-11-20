"""Automatic ad generation - 1-click mode."""

from datetime import datetime
from ad_engine.core.ad_copy import generate_ad_copy
from ad_engine.core.ad_visuals import build_visual_prompt, generate_ad_image
from ad_engine.core.variations import get_variation_index
from models.image.controller import png_to_base64_uri
import os
from datetime import datetime

script_dir = os.path.dirname(os.path.abspath(__file__))

northface_brand = {
    "id": "c9b3c54a-98e7-4d31-9f12-tnf123456789",
    "name": "The North Face",
    "domain": "thenorthface.com",
    "website_url": "https://www.thenorthface.com",
    "logo_url": "https://upload.wikimedia.org/wikipedia/commons/8/8d/The_North_Face_logo.svg",
    "user_id": "brand-seed-default",
    "created_at": datetime.utcnow().isoformat(),
    "updated_at": datetime.utcnow().isoformat(),

    "brand_info": {
        "company_details": {
            "name": "The North Face",
            "slogan": "Never Stop Exploring",
            "description": (
                "The North Face is an outdoor lifestyle and performance brand known for its "
                "high-quality, durable gear designed to empower adventure in all conditions."
            ),
            "url": "https://www.thenorthface.com",
            "category": "Outdoor Apparel & Equipment",
        },
        "tone": {
            "keywords": ["Adventurous", "Bold", "Authentic", "Outdoor-Focused", "Reliable"],
            "voice": (
                "Inspiring and confident. Uses direct, motivating language that speaks to explorers "
                "and nature enthusiasts. Avoids fluff—every word feels earned through experience."
            ),
        },
        "product_features": {
            "core_features": [
                "Weather Resistant",
                "Durable Construction",
                "Insulated Layers",
                "Breathable Fabric",
                "Adventure Ready",
            ],
            "usps": [
                "Never Stop Exploring",
                "Built for the Outdoors",
                "Proven in Extreme Conditions",
            ],
        },
        "audience": {
            "primary": ["Outdoor Enthusiasts", "Hikers", "Adventure Seekers", "Nature Lovers"],
            "secondary": ["Urban Explorers", "Travelers", "Climbers", "Skiers"],
            "psychographics": (
                "People who value challenge, authenticity, and quality gear that performs under pressure."
            ),
        },
        "url": "https://www.thenorthface.com",
    },

    "colors": {
        "css_colors": ["#000000", "#FFFFFF", "#E74C3C"],
        "palette": [
            "#000000", "#1C1C1C", "#2E2E2E", "#E74C3C", "#F2F2F2",
            "#FFFFFF", "#4C4C4C", "#9B9B9B", "#C0392B", "#ECECEC"
        ],
        "dominant_colors": ["#000000", "#FFFFFF", "#E74C3C", "#2E2E2E"],
        "logo_colors": ["#000000", "#FFFFFF"],
        "image_colors": [
            "#0A0A0A", "#121212", "#1F1F1F", "#E74C3C", "#B23B2D", "#FFFFFF",
            "#7C7C7C", "#F8F8F8", "#2E2E2E", "#DADADA", "#A6A6A6", "#000000",
            "#EFEFEF", "#C0392B", "#F4F4F4"
        ],
    },

    "image_urls": [
        "https://images.thenorthface.com/is/image/TheNorthFaceEU/tnf_product_1.jpg",
        "https://images.thenorthface.com/is/image/TheNorthFaceEU/tnf_product_2.jpg",
        "https://images.thenorthface.com/is/image/TheNorthFaceEU/tnf_product_3.jpg",
        "https://images.thenorthface.com/is/image/TheNorthFaceEU/tnf_product_4.jpg",
        "https://images.thenorthface.com/is/image/TheNorthFaceEU/tnf_product_5.jpg",
    ],

    "product_image": os.path.join(script_dir, "shopping.png"),
}


def generate_auto_ad(ad_type, brand, variation_index=None, image_source=None, temperature=0.9):
    """Generate a complete ad automatically with AI-generated copy."""
    if variation_index is None:
        variation_index = get_variation_index()

    # Generate copy with AI
    copy_data = generate_ad_copy(ad_type, brand, temperature)

    # Build visual prompt
    visual_prompt = build_visual_prompt(
        ad_type, 
        brand,
        copy_data, 
        variation_index 
    )

    # Use provided image source or fallback to hardcoded shopping.png
    if image_source is None:
        image_source = os.path.join(script_dir, "shopping.png")
    
    # If image_source is a file path, use it directly
    # If it's a URL or file object, it will be handled by generate_ad_image
    image_base64 = png_to_base64_uri(image_source) if isinstance(image_source, str) and os.path.exists(image_source) else None
    
    final_image = generate_ad_image(visual_prompt, image_source)

    return {
        "ad_type": ad_type,
        "copy": copy_data,
        "visual_prompt": visual_prompt,
        "image": final_image,
        "image_base64": image_base64,  # Include base64 for reference (may be None for URLs)
    }

