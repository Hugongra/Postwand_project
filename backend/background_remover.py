import torch
import urllib.request
import os
import numpy as np
from PIL import Image
from segment_anything import sam_model_registry, SamAutomaticMaskGenerator

class BackgroundRemover:
    def __init__(self):
        model_path = "sam_vit_b_01ec64.pth"
        if not os.path.exists(model_path):
            print("Downloading SAM model (400MB)...")
            urllib.request.urlretrieve(
                "https://dl.fbaipublicfiles.com/segment_anything/sam_vit_b_01ec64.pth",
                model_path
            )
            print("Download complete!")
        
        sam = sam_model_registry["vit_b"](checkpoint=model_path)
        self.mask_generator = SamAutomaticMaskGenerator(sam)
        
    def remove_background(self, image):
        if isinstance(image, Image.Image):
            image = np.array(image)
            
        masks = self.mask_generator.generate(image)
        
        if not masks:
            return None
        
        # Filter masks by position (objects in center are usually foreground)
        h, w = image.shape[:2]
        center_x, center_y = w // 2, h // 2
        
        # Score masks by distance from center and size
        scored_masks = []
        for mask in masks:
            area = mask['area']
            bbox = mask['bbox']  # [x, y, width, height]
            
            # Distance from center
            mask_center_x = bbox[0] + bbox[2] // 2
            mask_center_y = bbox[1] + bbox[3] // 2
            distance = ((mask_center_x - center_x) ** 2 + (mask_center_y - center_y) ** 2) ** 0.5
            
            # Prefer medium-sized objects near center
            score = area / (1 + distance * 0.01)
            scored_masks.append((score, mask))
        
        # Get best mask
        best_mask = max(scored_masks, key=lambda x: x[0])[1]
        result = self.apply_transparency(image, best_mask['segmentation'])
        return result
    
    def apply_transparency(self, image, mask):
        result = np.zeros((image.shape[0], image.shape[1], 4), dtype=np.uint8)
        result[mask] = np.concatenate([
            image[mask], 
            np.full((mask.sum(), 1), 255, dtype=np.uint8)
        ], axis=1)
        return Image.fromarray(result, 'RGBA')

# Test
if __name__ == "__main__":
    bg_remover = BackgroundRemover()
    
    # Replace with your image path
    image = Image.open('try.webp').convert('RGB')
    result = bg_remover.remove_background(image)
    
    if result:
        result.save('output_no_background.png')
        print("Success! Check output_no_background.png")
    else:
        print("No objects detected")