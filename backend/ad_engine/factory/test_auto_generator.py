"""Test script for auto_generator with North Face brand."""

import sys
import os

# Add backend directory to path
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, backend_dir)

# Load environment variables
from dotenv import load_dotenv
load_dotenv(os.path.join(backend_dir, '.env'))

from ad_engine.factory.auto_generator import generate_auto_ad, northface_brand
import json
from models.image.controller import base64_to_png
from models.image.controller import edit_image
from models.image.controller import png_to_base64_uri
def test_edit_image():
    """Test image editing with OpenAI."""
    prompt = """
    Place the product in the middle of the image. Reduce the size of the product to 50% of the original size. Tilt the product slightly to the right.
    Place a headline centeredat the top of the image that says 'Skincare for all skin types' in a ultra-thick, ultra-bold modern  green serif font with clean geometric lines and a solid fill.
    Make the text big enough so that it is displayed in two lines, not in one line.
    Background is green with a subtle gradient.
    """
    aspect_ratio = "1:1"
    num_images = 1
    images =  "skin.png"
    image_base64 = png_to_base64_uri(images)
    response = edit_image('nano_banana',prompt, aspect_ratio, num_images, image_base64)
    #base64_to_png(response['images'], "edited_image.png")
    print(response)


def test_auto_ad():
    """Test automatic ad generation with North Face brand."""
    print("=" * 80)
    print("Testing Auto Ad Generator with The North Face Brand")
    print("=" * 80)
    print()
    
    # Test with different ad types
    ad_types = [
        "product",
        "social_proof",
        "before_after",
        "comparison",
        "problem_solution",
        "controversial_question"
    ]
    
    print(f"Brand: {northface_brand['name']}")
    print(f"Using hardcoded image: shopping.png")
    print()
    
    # Test with comparison ad type - Side-by-Side Split variation
    ad_type = "product"
    print(f"Generating '{ad_type}' ad with 'Side-by-Side Split' variation...")
    print("-" * 80)
    
    try:
        result = generate_auto_ad(
            ad_type=ad_type,
            brand=northface_brand,
            variation_index=0,
            temperature=0.9
        )
        
        print(f"\n✓ Ad Type: {result['ad_type']}")
        print(f"\n✓ Copy Data:")
        print(json.dumps(result['copy'], indent=2))
        print(f"\n✓ Visual Prompt:")
        print(result['visual_prompt'])
        print(f"\n✓ Image: {str(result['image'])[:200]}...")
        print(f"\n✓ Image Base64: {str(result['image_base64'])[:100]}...")
        print("\n" + "=" * 80)
        print("✓ Test completed successfully!")
        print("=" * 80)
        
    except Exception as e:
        print(f"\n✗ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_edit_image()

