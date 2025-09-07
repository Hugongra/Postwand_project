import os
from fontTools.ttLib import TTFont

# Set the path to your fonts directory
fonts_dir = "C:/Users/alalb/SocialMediaManagerSaas/frontend/public/convert"

# Iterate over each font directory
for font_dir in os.listdir(fonts_dir):
    font_dir_path = os.path.join(fonts_dir, font_dir)
    
    # Find the TTF file within the font directory
    ttf_files = [f for f in os.listdir(font_dir_path) if f.endswith(".ttf")]
    
    if not ttf_files:
        print(f"No TTF file found in directory: {font_dir}")
        continue
    
    # Use the first TTF file found
    ttf_file = ttf_files[0]
    font_path = os.path.join(font_dir_path, ttf_file)
    font_name = os.path.splitext(ttf_file)[0]
    
    # Check if WOFF and WOFF2 files already exist
    woff_path = os.path.join(font_dir_path, f"{font_name}.woff")
    woff2_path = os.path.join(font_dir_path, f"{font_name}.woff2")
    
    if os.path.isfile(woff_path) and os.path.isfile(woff2_path):
        print(f"WOFF and WOFF2 files already exist for {ttf_file}. Skipping conversion.")
        continue
    
    # Load the TTF font
    font = TTFont(font_path)
    
    # Save as WOFF if not already present
    if not os.path.isfile(woff_path):
        font.flavor = "woff"
        font.save(woff_path)
        print(f"Converted {ttf_file} to WOFF.")
    
    # Save as WOFF2 if not already present
    if not os.path.isfile(woff2_path):
        font.flavor = "woff2"
        font.save(woff2_path)
        print(f"Converted {ttf_file} to WOFF2.")