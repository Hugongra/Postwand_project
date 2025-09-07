#!/usr/bin/env python
"""
Brand Assets Extraction Tool
----------------------------
Extract brand assets (logo, colors, palette) from a website URL.
"""

import os
import argparse
import sys
from urllib.parse import urlparse

# Handle imports for both direct execution and module import
try:
    # When run directly
    sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    from backend.brand_extraction.logo_extraction import normalize_url, download_logo, download_all_images
    from backend.brand_extraction.color_extraction import extract_colors_from_website
except ImportError:
    # When imported as module
    from .logo_extraction import normalize_url, download_logo, download_all_images
    from .color_extraction import extract_colors_from_website

def extract_brand_assets(url, output_dir="brand_assets", max_images=5, max_colors=10):
    """
    Extract brand assets (logo, images, colors) from a website.
    
    Args:
        url (str): Website URL
        output_dir (str): Directory to save outputs
        max_images (int): Maximum number of images to download
        max_colors (int): Maximum colors in the palette
        
    Returns:
        dict: Dictionary containing all brand assets information
    """
    print(f"Extracting brand assets from: {url}")
    normalized_url = normalize_url(url)
    domain = urlparse(normalized_url).netloc.replace("www.", "")
    
    # Create output directories
    logo_dir = os.path.join(output_dir, "logos")
    image_dir = os.path.join(output_dir, "images")
    
    os.makedirs(logo_dir, exist_ok=True)
    os.makedirs(image_dir, exist_ok=True)
    
    # Check for existing logo
    logo_path = None
    if os.path.exists(logo_dir):
        for file in os.listdir(logo_dir):
            if file.startswith(f"{domain}_logo"):
                logo_path = os.path.join(logo_dir, file)
                print(f"Using existing logo: {logo_path}")
                break
    
    # Download logo only if not found
    if not logo_path:
        print("Downloading logo...")
        try:
            logo_path = download_logo(normalized_url, output_dir=logo_dir)
            if logo_path:
                print(f"Logo downloaded to: {logo_path}")
            else:
                print("Logo download failed")
        except Exception as e:
            print(f"Error downloading logo: {e}")
            logo_path = None
    
    # Check for existing images
    image_paths = []
    if os.path.exists(image_dir):
        for file in os.listdir(image_dir):
            if file.startswith(f"{domain}_image_"):
                image_paths.append(os.path.join(image_dir, file))
    
    # Download images only if none are found
    if not image_paths:
        print("Downloading images...")
        try:
            # Use the default 'website_images' directory first to ensure compatibility
            # And then move files to our desired directory
            temp_paths = download_all_images(normalized_url, max_images=max_images)
            
            # Check if download was successful
            if temp_paths:
                # Move images to our desired directory
                image_paths = []
                os.makedirs(image_dir, exist_ok=True)
                
                for temp_path in temp_paths:
                    if os.path.exists(temp_path):
                        filename = os.path.basename(temp_path)
                        new_path = os.path.join(image_dir, filename)
                        # Copy file to new location
                        import shutil
                        shutil.copy2(temp_path, new_path)
                        image_paths.append(new_path)
                        print(f"Moved image to: {new_path}")
            else:
                print("No images were downloaded")
        except Exception as e:
            print(f"Error downloading images: {e}")
            image_paths = []
    else:
        print(f"Using {len(image_paths)} existing images")
    
    # Extract colors
    print("Extracting colors and generating palette...")
    colors = extract_colors_from_website(normalized_url, logo_path, image_paths, max_colors)
    
    # Save color data to a file
    color_file = os.path.join(output_dir, f"{domain}_colors.txt")
    with open(color_file, 'w') as f:
        f.write(f"Brand Colors for {url}\n")
        f.write("="*50 + "\n\n")
        
        f.write("Dominant Colors:\n")
        for color in colors['dominant_colors']:
            f.write(f"  {color}\n")
        
        f.write("\nColor Palette:\n")
        for color in colors['palette']:
            f.write(f"  {color}\n")
        
        f.write("\nCSS Colors (raw):\n")
        for color in colors['css_colors']:
            f.write(f"  {color}\n")
        
        f.write("\nLogo Colors (raw):\n")
        for color in colors['logo_colors']:
            f.write(f"  {color}\n")
        
        f.write("\nImage Colors (raw):\n")
        for color in colors['image_colors']:
            f.write(f"  {color}\n")
    
    print(f"Color data saved to {color_file}")
    
    # Return all the extracted information
    return {
        "logo_path": logo_path,
        "image_paths": image_paths,
        "colors": colors,
        "color_file": color_file
    }

def main():
    parser = argparse.ArgumentParser(description="Extract brand assets from a website")
    parser.add_argument("url", help="Website URL to extract assets from")
    parser.add_argument("--output", "-o", default="brand_assets",
                      help="Output directory (default: brand_assets)")
    parser.add_argument("--max-images", "-i", type=int, default=5,
                      help="Maximum number of images to extract (default: 5)")
    parser.add_argument("--max-colors", "-c", type=int, default=10,
                      help="Maximum colors in palette (default: 10)")
    
    args = parser.parse_args()
    
    assets = extract_brand_assets(
        args.url, 
        output_dir=args.output,
        max_images=args.max_images,
        max_colors=args.max_colors
    )
    
    print("\n===== Extraction Results =====")
    print(f"Logo: {os.path.basename(assets['logo_path']) if assets['logo_path'] else 'Not found'}")
    print(f"Images: {len(assets['image_paths'])} extracted")
    print(f"Colors: {len(assets['colors']['palette'])} in palette")
    print(f"Color data saved to: {os.path.basename(assets['color_file'])}")
    print(f"All files saved to: {args.output}/")

if __name__ == "__main__":
    main() 