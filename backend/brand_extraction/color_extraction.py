import requests
from bs4 import BeautifulSoup
import re
import os
import uuid
from urllib.parse import urljoin, urlparse
import numpy as np
from PIL import Image
import colorsys
from sklearn.cluster import KMeans
import json
from io import BytesIO

def normalize_url(url):
    """Ensure URL has proper HTTP/HTTPS prefix"""
    if not url.startswith(('http://', 'https://')):
        return 'https://' + url.lstrip('/')
    return url

def get_soup(url):
    """
    Helper function to get BeautifulSoup object from a URL.
    Handles URL normalization, request headers, and error handling.
    """
    # Ensure URL has proper HTTP/HTTPS prefix
    url = normalize_url(url)
    
    print(f"Fetching content from URL: {url}")
    
    # Set headers to mimic a browser
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
    
    # Send request with error handling
    try:
        response = requests.get(url, headers=headers, timeout=10)
        # Print final URL after any redirects
        print(f"Final URL after redirects: {response.url}")
        response.raise_for_status()
        return BeautifulSoup(response.text, 'html.parser')
    except requests.RequestException as e:
        raise Exception(f"Error fetching the URL: {e}")

def is_valid_hex_color(color):
    """Validate if a string is a proper hex color code"""
    if not color or not isinstance(color, str):
        return False
    # Match exactly #RGB or #RRGGBB format
    return bool(re.match(r'^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$', color))

def get_image_from_url(image_url):
    """
    Download image from URL and return as PIL Image object
    """
    try:
        response = requests.get(image_url, timeout=10)
        response.raise_for_status()
        return Image.open(BytesIO(response.content))
    except Exception as e:
        print(f"Error downloading image from {image_url}: {e}")
        return None

class ColorExtractor:
    def __init__(self, url, logo_url=None, image_urls=None, max_colors=10):
        """
        Initialize the color extractor with a URL and optional paths to logo and images.
        
        Args:
            url (str): Website URL to extract colors from
            logo_url (str): URL to the logo image in Supabase
            image_urls (list): List of URLs to website images in Supabase
            max_colors (int): Maximum number of colors to include in the palette
        """
        self.url = normalize_url(url)
        self.logo_url = logo_url
        self.image_urls = image_urls or []
        self.max_colors = max_colors
        self.colors = {
            'css_colors': [],
            'image_colors': [],
            'logo_colors': [],
            'dominant_colors': [],
            'palette': []
        }
    
    def extract_css_colors(self):
        """Extract color codes (hex, rgb) from inline styles and <style> blocks"""
        try:
            soup = get_soup(self.url)
            
            # Collect CSS from <style> tags and inline style attributes
            css_text = " ".join([tag.get_text() for tag in soup.find_all('style')])
            for tag in soup.find_all(style=True):
                css_text += " " + tag['style']
            
            # Find external CSS files
            for link in soup.find_all('link', rel='stylesheet'):
                if link.get('href'):
                    css_url = urljoin(self.url, link.get('href'))
                    try:
                        css_response = requests.get(css_url, timeout=5)
                        if css_response.status_code == 200:
                            css_text += " " + css_response.text
                    except Exception as e:
                        print(f"Error fetching CSS from {css_url}: {e}")
                        continue
            
            # Regex patterns for hex colors and RGB values
            hex_pattern = r'#[0-9A-Fa-f]{3,6}\b'
            rgb_pattern = r'rgba?\([^)]*\)'
            
            hex_colors = re.findall(hex_pattern, css_text)
            rgb_colors = re.findall(rgb_pattern, css_text)
            
            # Standardize hex colors (convert #abc to #aabbcc)
            standardized_hex = []
            for color in hex_colors:
                if len(color) == 4:  # #rgb format
                    r, g, b = color[1], color[2], color[3]
                    standardized_hex.append(f"#{r}{r}{g}{g}{b}{b}")
                else:
                    standardized_hex.append(color.lower())
            
            # Process RGB colors to hex
            processed_rgb = []
            for color in rgb_colors:
                rgb_values = re.search(r'rgba?\((\d+),\s*(\d+),\s*(\d+)', color)
                if rgb_values:
                    r, g, b = map(int, rgb_values.groups())
                    hex_color = f"#{r:02x}{g:02x}{b:02x}"
                    processed_rgb.append(hex_color)
            
            # Combine and remove duplicates
            all_colors = list(set(standardized_hex + processed_rgb))
            
            # Filter out black, white, and validate hex format
            filtered_colors = []
            for c in all_colors:
                if c not in ['#000000', '#ffffff'] and is_valid_hex_color(c):
                    filtered_colors.append(c)
            
            self.colors['css_colors'] = filtered_colors
            return filtered_colors
            
        except Exception as e:
            print(f"Error extracting CSS colors: {e}")
            return []
    
    def extract_image_colors(self, num_colors=5):
        """Extract dominant colors from images at provided URLs"""
        if not self.image_urls:
            return []
        
        all_colors = []
        for img_url in self.image_urls:
            try:
                # Download image from URL
                img = get_image_from_url(img_url)
                if not img:
                    print(f"Warning: Could not download image: {img_url}")
                    continue
                    
                # Create a white background for transparent images
                if img.mode == 'RGBA':
                    background = Image.new('RGBA', img.size, (255, 255, 255))
                    img = Image.alpha_composite(background, img).convert('RGB')
                else:
                    img = img.convert('RGB')
                
                # Resize large images for faster processing
                if img.width * img.height > 1000000:  # If more than 1 million pixels
                    factor = 0.5
                    img = img.resize((int(img.width * factor), int(img.height * factor)))
                
                pixels = np.array(img)
                pixels = pixels.reshape(-1, 3)
                
                # Use a smaller sample size for large images to improve performance
                sample_size = min(len(pixels), 10000)  # Limit sample size
                indices = np.random.choice(len(pixels), sample_size, replace=False)
                pixel_sample = pixels[indices]
                
                # Using k-means for clustering
                kmeans = KMeans(n_clusters=num_colors, n_init=10)
                kmeans.fit(pixel_sample)
                
                # Get the dominant colors
                colors = kmeans.cluster_centers_
                
                # Convert to hex colors
                for color in colors:
                    r, g, b = [int(c) for c in color]
                    hex_color = f"#{r:02x}{g:02x}{b:02x}"
                    if is_valid_hex_color(hex_color):
                        all_colors.append(hex_color)
            except Exception as e:
                print(f"Error processing image {img_url}: {e}")
        
        self.colors['image_colors'] = list(set(all_colors))
        return self.colors['image_colors']
    
    def extract_logo_colors(self, num_colors=5):
        """Extract dominant colors from the logo URL"""
        if not self.logo_url:
            print("No logo URL provided")
            return []
        
        try:
            # Download logo from URL
            img = get_image_from_url(self.logo_url)
            if not img:
                print(f"Warning: Could not download logo: {self.logo_url}")
                return []
            
            print(f"Processing logo from URL: {self.logo_url}")
            
            # Create a white background for transparent images
            if img.mode == 'RGBA':
                # For logo, we want to count only non-transparent pixels
                data = np.array(img)
                non_transparent = data[:,:,3] > 0  # Alpha channel > 0
                
                # Only process non-transparent pixels (alpha > 0)
                if np.any(non_transparent):  # Check if there are any non-transparent pixels
                    pixels = data[non_transparent][:,:3]
                else:
                    # If all pixels are transparent, use the full image converted to RGB
                    print("Warning: Logo image is completely transparent, using full image")
                    img = img.convert('RGB')
                    pixels = np.array(img)
                    pixels = pixels.reshape(-1, 3)
            else:
                img = img.convert('RGB')
                pixels = np.array(img)
                pixels = pixels.reshape(-1, 3)
            
            if len(pixels) == 0:
                print("Warning: No valid pixels found in logo")
                return []
            
            # Use a smaller sample size for large logos to improve performance
            sample_size = min(len(pixels), 10000)  # Limit sample size
            indices = np.random.choice(len(pixels), sample_size, replace=False)
            pixel_sample = pixels[indices]
            
            # Using k-means for clustering
            n_clusters = min(num_colors, len(pixel_sample))
            if n_clusters < 1:
                print("Warning: Not enough pixels for clustering")
                return []
                
            kmeans = KMeans(n_clusters=n_clusters, n_init=10)
            kmeans.fit(pixel_sample)
            
            # Get the dominant colors and their frequencies
            colors = kmeans.cluster_centers_
            labels = kmeans.labels_
            
            # Count frequencies of each cluster
            unique_labels, counts = np.unique(labels, return_counts=True)
            
            # Sort by frequency
            sorted_indices = np.argsort(counts)[::-1]
            sorted_colors = colors[sorted_indices]
            
            # Convert to hex colors
            logo_colors = []
            for color in sorted_colors:
                r, g, b = [int(c) for c in color]
                hex_color = f"#{r:02x}{g:02x}{b:02x}"
                if is_valid_hex_color(hex_color):
                    logo_colors.append(hex_color)
            
            self.colors['logo_colors'] = logo_colors
            return logo_colors
            
        except Exception as e:
            print(f"Error extracting logo colors: {e}")
            return []
    
    def hex_to_rgb(self, hex_color):
        """Convert hex color to RGB tuple"""
        if not is_valid_hex_color(hex_color):
            print(f"Warning: Invalid hex color format: {hex_color}")
            return (0, 0, 0)  # Return black for invalid colors
            
        hex_color = hex_color.lstrip('#')
        if len(hex_color) == 3:
            # Convert #rgb to #rrggbb
            r, g, b = hex_color[0], hex_color[1], hex_color[2]
            hex_color = f"{r}{r}{g}{g}{b}{b}"
            
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    
    def rgb_to_hsv(self, rgb_color):
        """Convert RGB color to HSV"""
        r, g, b = [x/255.0 for x in rgb_color]
        return colorsys.rgb_to_hsv(r, g, b)
    
    def color_distance(self, color1, color2):
        """Calculate perceptual distance between two colors in HSV space"""
        # Validate inputs
        if not is_valid_hex_color(color1) or not is_valid_hex_color(color2):
            return float('inf')  # Return "infinite" distance for invalid colors
            
        hsv1 = self.rgb_to_hsv(self.hex_to_rgb(color1))
        hsv2 = self.rgb_to_hsv(self.hex_to_rgb(color2))
        
        # Weight hue higher than saturation and value
        h_dist = min(abs(hsv1[0] - hsv2[0]), 1 - abs(hsv1[0] - hsv2[0])) * 2.0
        s_dist = abs(hsv1[1] - hsv2[1])
        v_dist = abs(hsv1[2] - hsv2[2])
        
        return h_dist + s_dist + v_dist
    
    def group_similar_colors(self, colors, threshold=0.3):
        """Group similar colors together"""
        if not colors:
            return []
        
        # Filter out invalid colors first
        valid_colors = [c for c in colors if is_valid_hex_color(c)]
        if not valid_colors:
            return []
            
        groups = []
        ungrouped = valid_colors.copy()
        
        while ungrouped:
            current = ungrouped.pop(0)
            current_group = [current]
            
            i = 0
            while i < len(ungrouped):
                color = ungrouped[i]
                try:
                    if self.color_distance(current, color) < threshold:
                        current_group.append(color)
                        ungrouped.pop(i)
                    else:
                        i += 1
                except Exception as e:
                    print(f"Error comparing colors {current} and {color}: {e}")
                    i += 1  # Skip this problematic color
            
            groups.append(current_group)
        
        return groups
    
    def generate_palette(self):
        """Generate a coherent color palette from all extracted colors"""
        # Combine all colors, prioritizing logo colors
        all_colors = []
        
        # Start with logo colors (highest priority)
        all_colors.extend(self.colors['logo_colors'])
        
        # Then add CSS colors
        for color in self.colors['css_colors']:
            if color not in all_colors:
                all_colors.append(color)
        
        # Then add image colors
        for color in self.colors['image_colors']:
            if color not in all_colors:
                all_colors.append(color)
        
        # Filter valid colors
        valid_colors = [c for c in all_colors if is_valid_hex_color(c)]
        if not valid_colors:
            print("Warning: No valid colors found for grouping")
            return []
            
        # Group similar colors
        try:
            color_groups = self.group_similar_colors(valid_colors)
            
            # Select representative color from each group (first color)
            palette = [group[0] for group in color_groups]
            
            # Limit palette size
            palette = palette[:self.max_colors]
            
            self.colors['palette'] = palette
            return palette
        except Exception as e:
            print(f"Error generating palette: {e}")
            return []
    
    def extract_colors(self):
        """Extract all colors and generate palette"""
        print("Extracting CSS colors...")
        self.extract_css_colors()
        
        print("Extracting logo colors...")
        self.extract_logo_colors()
        
        print("Extracting image colors...")
        self.extract_image_colors()
        
        print("Generating color palette...")
        palette = self.generate_palette()
        
        # Determine dominant colors by prioritizing logo colors
        if self.colors['logo_colors']:
            # If we have logo colors, they're the dominant ones
            self.colors['dominant_colors'] = self.colors['logo_colors'][:5]
        elif palette:
            # Otherwise use the first few from the palette
            self.colors['dominant_colors'] = palette[:5]
        
        return self.colors

def extract_colors_from_website(url, logo_url=None, image_urls=None, max_colors=10):
    """
    Extract colors from a website, including CSS colors and colors from images.
    
    Args:
        url (str): Website URL
        logo_url (str): URL to the logo image in Supabase
        image_urls (list): List of URLs to website images in Supabase
        max_colors (int): Maximum number of colors in the palette
        
    Returns:
        dict: Dictionary with css_colors, image_colors, logo_colors, dominant_colors and palette
    """
    extractor = ColorExtractor(url, logo_url, image_urls, max_colors)
    return extractor.extract_colors()

def visualize_color_palette(colors, output_path=None, width=500, height=100):
    """
    Create a visual representation of the color palette.
    
    Args:
        colors (list): List of hex color codes
        output_path (str, optional): Path to save the image
        width (int): Width of the output image
        height (int): Height of the output image
        
    Returns:
        PIL.Image: Image object with the color palette
    """
    if not colors:
        print("No colors to visualize")
        return None
    
    try:
        # Create a new image with the specified dimensions
        img = Image.new('RGB', (width, height), color='white')
        pixels = img.load()
        
        # Calculate the width of each color segment
        segment_width = width // len(colors)
        
        # Draw each color as a vertical stripe
        for i, color in enumerate(colors):
            if not is_valid_hex_color(color):
                print(f"Skipping invalid color: {color}")
                continue
                
            rgb_color = tuple(int(color.lstrip('#')[j:j+2], 16) for j in (0, 2, 4))
            for x in range(segment_width * i, segment_width * (i + 1)):
                for y in range(height):
                    if x < width:  # Ensure we don't go out of bounds
                        pixels[x, y] = rgb_color
        
        # Save the image if output_path is provided
        if output_path:
            img.save(output_path)
            print(f"Color palette visualization saved to {output_path}")
        
        return img
    
    except Exception as e:
        print(f"Error visualizing color palette: {e}")
        return None

def run_color_extraction(url, visualize=True, output_format='dict'):
    """
    Run the complete color extraction process with your existing image/logo download code.
    
    Args:
        url (str): Website URL
        visualize (bool): Whether to generate a visualization of the palette
        output_format (str): Output format ('dict' or 'json')
        
    Returns:
        dict or str: Dictionary with extracted colors and paths to downloaded assets,
                    or JSON string if output_format is 'json'
    """
    # This function assumes that your existing functions from logo_extraction.py are imported
    from logo_extraction import download_logo, download_all_images, normalize_url
    
    normalized_url = normalize_url(url)
    domain = urlparse(normalized_url).netloc.replace("www.", "")
    
    # Create output directories
    logo_dir = "logos"
    image_dir = "website_images"
    output_dir = "color_palettes"
    
    for directory in [logo_dir, image_dir, output_dir]:
        if not os.path.exists(directory):
            os.makedirs(directory)
    
    # Check for existing logo
    logo_url = None
    if os.path.exists(logo_dir):
        for file in os.listdir(logo_dir):
            if file.startswith(f"{domain}_logo"):
                logo_url = os.path.join(logo_dir, file)
                print(f"Using existing logo: {logo_url}")
                break
    
    # Download logo only if not found
    if not logo_url:
        print("Downloading logo...")
        logo_url = download_logo(normalized_url)
    
    # Check for existing images
    image_urls = []
    if os.path.exists(image_dir):
        for file in os.listdir(image_dir):
            if file.startswith(f"{domain}_image_"):
                image_urls.append(os.path.join(image_dir, file))
    
    # Download images only if none are found
    if not image_urls:
        print("Downloading images...")
        image_urls = download_all_images(normalized_url, max_images=5)
    else:
        print(f"Using {len(image_urls)} existing images")
    
    # Extract colors
    colors = extract_colors_from_website(normalized_url, logo_url, image_urls)
    
    # Output color information
    print("\nExtracted Colors:")
    print(f"CSS colors: {len(colors['css_colors'])}")
    print(f"Logo colors: {len(colors['logo_colors'])}")
    print(f"Image colors: {len(colors['image_colors'])}")
    
    print("\nDominant Colors (prioritizing logo):")
    for color in colors['dominant_colors']:
        print(f"  {color}")
    
    print("\nColor Palette:")
    for color in colors['palette']:
        print(f"  {color}")
    
    # Visualize the color palette
    if visualize and colors['palette']:
        palette_path = os.path.join(output_dir, f"{domain}_palette.png")
        visualize_color_palette(colors['palette'], palette_path)
    
    result = {
        "colors": colors,
        "logo_url": logo_url,
        "image_urls": image_urls
    }
    
    if output_format == 'json':
        return json.dumps(result, indent=2)
    return result

def color_extraction(url, logo_url=None, image_urls=None, max_colors=10):
    """
    Main function to extract colors from a website
    Args:
        url (str): Website URL
        logo_url (str): URL to the logo image in Supabase
        image_urls (list): List of URLs to website images in Supabase
        max_colors (int): Maximum number of colors to extract
    Returns:
        dict: Dictionary containing extracted colors
    """
    try:
        # Initialize the extractor with URLs instead of file paths
        extractor = ColorExtractor(url, logo_url, image_urls, max_colors)
        
        # Add this function to resize images before processing
        def optimize_image_for_processing(img, max_dimension=400):
            """Resize image to reduce processing time while preserving color information"""
            if img.width > max_dimension or img.height > max_dimension:
                # Calculate ratio to maintain aspect ratio
                ratio = min(max_dimension / img.width, max_dimension / img.height)
                new_size = (int(img.width * ratio), int(img.height * ratio))
                return img.resize(new_size, Image.LANCZOS)
            return img
        
        # When processing the logo
        if logo_url:
            try:
                # Download logo from URL
                img = get_image_from_url(logo_url)
                if not img:
                    print(f"Warning: Could not download logo: {logo_url}")
                    return {
                        'dominant_colors': [],
                        'palette': [],
                        'logo_colors': [],
                        'css_colors': [],
                        'image_colors': []
                    }
                
                print(f"Processing logo from URL: {logo_url}")
                
                # Add this line to resize before processing
                img = optimize_image_for_processing(img)
                
                # Create a white background for transparent images
                if img.mode == 'RGBA':
                    # For logo, we want to count only non-transparent pixels
                    data = np.array(img)
                    non_transparent = data[:,:,3] > 0  # Alpha channel > 0
                    
                    # Only process non-transparent pixels (alpha > 0)
                    if np.any(non_transparent):  # Check if there are any non-transparent pixels
                        pixels = data[non_transparent][:,:3]
                    else:
                        # If all pixels are transparent, use the full image converted to RGB
                        print("Warning: Logo image is completely transparent, using full image")
                        img = img.convert('RGB')
                        pixels = np.array(img)
                        pixels = pixels.reshape(-1, 3)
                else:
                    img = img.convert('RGB')
                    pixels = np.array(img)
                    pixels = pixels.reshape(-1, 3)
                
                if len(pixels) == 0:
                    print("Warning: No valid pixels found in logo")
                    return {
                        'dominant_colors': [],
                        'palette': [],
                        'logo_colors': [],
                        'css_colors': [],
                        'image_colors': []
                    }
                
                # Use a smaller sample size for large logos to improve performance
                sample_size = min(len(pixels), 10000)  # Limit sample size
                indices = np.random.choice(len(pixels), sample_size, replace=False)
                pixel_sample = pixels[indices]
                
                # Using k-means for clustering
                n_clusters = min(5, len(pixel_sample))
                if n_clusters < 1:
                    print("Warning: Not enough pixels for clustering")
                    return {
                        'dominant_colors': [],
                        'palette': [],
                        'logo_colors': [],
                        'css_colors': [],
                        'image_colors': []
                    }
                    
                kmeans = KMeans(n_clusters=n_clusters, n_init=10)
                kmeans.fit(pixel_sample)
                
                # Get the dominant colors and their frequencies
                colors = kmeans.cluster_centers_
                labels = kmeans.labels_
                
                # Count frequencies of each cluster
                unique_labels, counts = np.unique(labels, return_counts=True)
                
                # Sort by frequency
                sorted_indices = np.argsort(counts)[::-1]
                sorted_colors = colors[sorted_indices]
                
                # Convert to hex colors
                logo_colors = []
                for color in sorted_colors:
                    r, g, b = [int(c) for c in color]
                    hex_color = f"#{r:02x}{g:02x}{b:02x}"
                    if is_valid_hex_color(hex_color):
                        logo_colors.append(hex_color)
                
                extractor.colors['logo_colors'] = logo_colors
                return {
                    'dominant_colors': logo_colors[:5],
                    'palette': logo_colors,
                    'logo_colors': logo_colors,
                    'css_colors': extractor.colors['css_colors'],
                    'image_colors': extractor.colors['image_colors']
                }
            except Exception as e:
                print(f"Error processing logo image: {str(e)}")
                return {
                    'dominant_colors': [],
                    'palette': [],
                    'logo_colors': [],
                    'css_colors': [],
                    'image_colors': []
                }
        
        # When processing other images
        if image_urls:
            for img_url in image_urls:
                try:
                    # Download image from URL
                    img = get_image_from_url(img_url)
                    if not img:
                        continue
                    
                    # Resize to smaller dimensions for faster processing
                    img = optimize_image_for_processing(img, max_dimension=300)
                    
                    # Reduce sample size for k-means clustering
                    sample_size = min(len(pixels), 5000)  # Reduce from 10000 to 5000
                    
                    # Use fewer clusters for faster processing
                    kmeans = KMeans(n_clusters=3, n_init=5)  # Reduce from 5 clusters, 10 inits
                    
                    pixels = np.array(img)
                    pixels = pixels.reshape(-1, 3)
                    
                    # Use a smaller sample size for large images to improve performance
                    sample_size = min(len(pixels), 10000)  # Limit sample size
                    indices = np.random.choice(len(pixels), sample_size, replace=False)
                    pixel_sample = pixels[indices]
                    
                    # Using k-means for clustering
                    kmeans.fit(pixel_sample)
                    
                    # Get the dominant colors
                    colors = kmeans.cluster_centers_
                    
                    # Convert to hex colors
                    for color in colors:
                        r, g, b = [int(c) for c in color]
                        hex_color = f"#{r:02x}{g:02x}{b:02x}"
                        if is_valid_hex_color(hex_color):
                            extractor.colors['image_colors'].append(hex_color)
                except Exception as e:
                    print(f"Error processing image {img_url}: {str(e)}")
                    continue
        
        # Extract all colors and generate palette
        colors = extractor.extract_colors()
        
        # Return a simplified version of the results
        return {
            'dominant_colors': colors['dominant_colors'],
            'palette': colors['palette'],
            'logo_colors': colors['logo_colors'],
            'css_colors': colors['css_colors'],
            'image_colors': colors['image_colors']
        }
    except Exception as e:
        print(f"Error in color extraction: {e}")
        return {
            'dominant_colors': [],
            'palette': [],
            'logo_colors': [],
            'css_colors': [],
            'image_colors': []
        }

if __name__ == "__main__":
    website_url = input("Enter the website URL to extract colors from: ")
    result = run_color_extraction(website_url, output_format='json')
    
    # Save palette to file
    domain = urlparse(normalize_url(website_url)).netloc.replace("www.", "")
    
    # Save as JSON file instead of text
    json_file = f"{domain}_colors.json"
    
    if isinstance(result, str):  # If result is already a JSON string
        with open(json_file, "w") as f:
            f.write(result)
    else:  # If result is still a dictionary
        with open(json_file, "w") as f:
            json.dump(result, f, indent=2)
    
    print(f"\nColor data saved to {json_file}")