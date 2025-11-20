from PIL import Image, ImageFilter

def upscale_png(input_path, output_path, scale=2):
    # Open the image
    img = Image.open(input_path)

    # Calculate new size
    new_size = (img.width * scale, img.height * scale)

    # Resize with high-quality resampling (LANCZOS is the best for upscaling)
    upscaled = img.resize(new_size, Image.LANCZOS)

    # Apply sharpening
    sharpened = upscaled.filter(ImageFilter.UnsharpMask(radius=2, percent=150, threshold=3))

    # Save as PNG (preserves transparency if present)
    sharpened.save(output_path, "PNG")
    print(f"Upscaled and sharpened image saved to {output_path}")

# Example usage:
upscale_png("nano_banana_.png", "nano_banana_edited_upscaled.png", scale=3)
