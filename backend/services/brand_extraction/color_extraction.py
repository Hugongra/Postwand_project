import os
import sys

# Add project root to path (parent of backend directory)
# File is at: postwand/backend/services/brand_extraction/color_extraction.py
# We need to add: postwand/ to the path
current_file = os.path.abspath(__file__)
brand_extraction_dir = os.path.dirname(current_file)  # brand_extraction
services_dir = os.path.dirname(brand_extraction_dir)  # services
backend_dir = os.path.dirname(services_dir)  # backend
project_root = os.path.dirname(backend_dir)  # postwand
sys.path.insert(0, project_root)

# Load environment variables FIRST before any imports that need them
from dotenv import load_dotenv
load_dotenv(os.path.join(backend_dir, '.env'))  # Load from backend/.env

import re
import colorsys
import requests
from PIL import Image
from io import BytesIO
from urllib.parse import urljoin
from backend.services.brand_extraction.utils import fetch_page


class ColorExtractor:
    """Extract brand colors from websites with clear priority: UI > CSS > Logo"""
    
    # Tailwind base colors (shade 500)
    TAILWIND_BASE = {
        "slate": "#64748b", "gray": "#6b7280", "zinc": "#71717a",
        "neutral": "#737373", "stone": "#78716c", "red": "#ef4444",
        "orange": "#f97316", "amber": "#f59e0b", "yellow": "#eab308",
        "lime": "#84cc16", "green": "#22c55e", "emerald": "#10b981",
        "teal": "#14b8a6", "cyan": "#06b6d4", "sky": "#0ea5e9",
        "blue": "#3b82f6", "indigo": "#6366f1", "violet": "#8b5cf6",
        "purple": "#a855f7", "fuchsia": "#d946ef", "pink": "#ec4899",
        "rose": "#f43f5e",
    }
    
    def __init__(self, url, logo=None, max_colors=10):
        self.url = url
        self.logo = logo
        self.max_colors = max_colors
        self.colors = {
            'ui_colors': [],
            'css_colors': [],
            'logo_colors': [],
            'palette': [],
            'dominant_colors': []
        }
    
    # ============================================================================
    # MAIN EXECUTION
    # ============================================================================
    
    def execute(self):
        """Main execution: fetch page once, extract all colors, build palette"""
        soup, _ = fetch_page(self.url)
        if not soup:
            return self.colors
        
        # Extract in priority order
        self._extract_ui_colors(soup)
        self._extract_css_colors(soup)
        self._extract_logo_colors()
        
        # Build final palette
        self._build_palette()
        return self.colors
    
    # ============================================================================
    # COLOR EXTRACTION
    # ============================================================================
    
    def _extract_ui_colors(self, soup):
        """Extract colors from buttons, links, and Tailwind classes"""
        colors = set()
        
        # Check interactive elements
        for elem in soup.select('button, a, input[type=submit], input[type=button]'):
            # Inline styles
            style = elem.get('style', '')
            colors.update(self._parse_colors_from_text(style))
            
            # Tailwind classes (bg-*, text-*, border-*)
            classes = ' '.join(elem.get('class', []))
            for match in re.finditer(r'\b(?:bg|text|border)-([a-z]+)-(\d+)\b', classes):
                color_name, shade = match.groups()
                tw_color = self._get_tailwind_color(color_name, int(shade))
                if tw_color:
                    colors.add(tw_color)
        
        self.colors['ui_colors'] = self._filter_colors(colors)
    
    def _extract_css_colors(self, soup):
        """Extract colors from CSS (inline styles, style tags, external sheets)"""
        css_text = ""
        
        # Inline style tags
        for tag in soup.find_all('style'):
            css_text += tag.get_text() + " "
        
        # All inline style attributes
        for tag in soup.find_all(style=True):
            css_text += tag['style'] + " "
        
        # External stylesheets
        for link in soup.find_all('link', rel='stylesheet', href=True):
            css_url = urljoin(self.url, link['href'])
            try:
                response = requests.get(css_url, timeout=5)
                if response.ok:
                    css_text += response.text + " "
            except:
                pass
        
        colors = self._parse_colors_from_text(css_text)
        self.colors['css_colors'] = self._filter_colors(colors)
    
    def _extract_logo_colors(self):
        """Extract colors from logo (ignores if grayscale-only)"""
        if not self.logo:
            return
        
        try:
            # Download and process image
            response = requests.get(self.logo, timeout=10)
            img = Image.open(BytesIO(response.content))
            
            # Convert to RGB
            if img.mode == 'RGBA':
                bg = Image.new('RGBA', img.size, (255, 255, 255))
                img = Image.alpha_composite(bg, img).convert('RGB')
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Resize for performance
            img.thumbnail((100, 100), Image.LANCZOS)
            
            # Count colors
            color_counts = {}
            for r, g, b in img.getdata():
                if not self._is_grayscale((r, g, b)):  # Skip grayscale
                    hex_color = f"#{r:02x}{g:02x}{b:02x}"
                    color_counts[hex_color] = color_counts.get(hex_color, 0) + 1
            
            # If no colorful pixels, ignore logo
            if not color_counts:
                return
            
            # Get top colors by frequency
            top_colors = sorted(color_counts.items(), key=lambda x: x[1], reverse=True)
            self.colors['logo_colors'] = [c[0] for c in top_colors[:5]]
            
        except Exception as e:
            print(f"Error extracting logo colors: {e}")
    
    # ============================================================================
    # PALETTE GENERATION
    # ============================================================================
    
    def _build_palette(self):
        """Build final palette with priority: UI > CSS > Logo"""
        all_colors = []
        
        # Priority order
        for source in ['ui_colors', 'css_colors', 'logo_colors']:
            for color in self.colors.get(source, []):
                if color not in all_colors:
                    all_colors.append(color)
        
        # Group similar colors and take representative
        palette = self._deduplicate_similar(all_colors)[:self.max_colors]
        
        self.colors['palette'] = palette
        self.colors['dominant_colors'] = palette[:5]
    
    def _deduplicate_similar(self, colors, threshold=0.25):
        """Remove similar colors, keeping the first occurrence"""
        if not colors:
            return []
        
        unique = [colors[0]]
        for color in colors[1:]:
            if all(self._color_distance(color, u) >= threshold for u in unique):
                unique.append(color)
        
        return unique
    
    # ============================================================================
    # COLOR UTILITIES
    # ============================================================================
    
    def _parse_colors_from_text(self, text):
        """Extract all color values (hex, rgb, hsl) from text"""
        colors = set()
        
        # Hex colors
        for hex_match in re.finditer(r'#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})\b', text):
            colors.add(self._normalize_hex(hex_match.group(0)))
        
        # RGB/RGBA
        for rgb_match in re.finditer(r'rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)', text):
            r, g, b = map(int, rgb_match.groups())
            colors.add(f"#{r:02x}{g:02x}{b:02x}")
        
        # HSL/HSLA
        for hsl_match in re.finditer(r'hsla?\(\s*([0-9.]+)\s*,\s*([0-9.]+)%\s*,\s*([0-9.]+)%', text):
            h = float(hsl_match.group(1)) / 360.0
            s = float(hsl_match.group(2)) / 100.0
            l = float(hsl_match.group(3)) / 100.0
            r, g, b = colorsys.hls_to_rgb(h, l, s)
            colors.add(f"#{int(r*255):02x}{int(g*255):02x}{int(b*255):02x}")
        
        return colors
    
    def _filter_colors(self, colors):
        """Remove black, white, and invalid colors"""
        return [
            c for c in colors 
            if c not in ('#000000', '#ffffff') and self._is_valid_hex(c)
        ]
    
    def _normalize_hex(self, hex_color):
        """Normalize 3-digit hex to 6-digit"""
        hex_color = hex_color.lower()
        if len(hex_color) == 4:  # #abc -> #aabbcc
            return f"#{hex_color[1]*2}{hex_color[2]*2}{hex_color[3]*2}"
        return hex_color
    
    def _is_valid_hex(self, color):
        """Check if valid hex color"""
        return bool(re.match(r'^#[0-9a-f]{6}$', color))
    
    def _is_grayscale(self, rgb):
        """Check if color is grayscale (R≈G≈B)"""
        r, g, b = rgb
        return abs(r - g) < 12 and abs(g - b) < 12 and abs(r - b) < 12
    
    def _get_tailwind_color(self, color_name, shade):
        """Generate Tailwind color for any shade (50-950)"""
        if color_name not in self.TAILWIND_BASE:
            return None
        
        base_hex = self.TAILWIND_BASE[color_name]
        r, g, b = [int(base_hex[i:i+2], 16) for i in (1, 3, 5)]
        h, s, v = colorsys.rgb_to_hsv(r / 255.0, g / 255.0, b / 255.0)
        
        # Tailwind shade mapping (500 is base)
        # Lighter shades (50-400): increase value, decrease saturation
        # Darker shades (600-950): decrease value
        shade_map = {
            50: (0.95, 0.9), 100: (0.9, 0.92), 200: (0.8, 0.95),
            300: (0.7, 0.97), 400: (0.85, 1.0), 500: (1.0, 1.0),
            600: (1.0, 0.85), 700: (1.0, 0.7), 800: (1.0, 0.55),
            900: (1.0, 0.4), 950: (1.0, 0.25)
        }
        
        if shade not in shade_map:
            return None
        
        s_mult, v_mult = shade_map[shade]
        new_s = min(s * s_mult, 1.0)
        new_v = min(v * v_mult, 1.0)
        
        r, g, b = colorsys.hsv_to_rgb(h, new_s, new_v)
        return f"#{int(r*255):02x}{int(g*255):02x}{int(b*255):02x}"
    
    def _color_distance(self, color1, color2):
        """Calculate perceptual distance between colors in HSV space"""
        def hex_to_hsv(hex_color):
            r, g, b = [int(hex_color[i:i+2], 16) / 255.0 for i in (1, 3, 5)]
            return colorsys.rgb_to_hsv(r, g, b)
        
        h1, s1, v1 = hex_to_hsv(color1)
        h2, s2, v2 = hex_to_hsv(color2)
        
        # Hue is circular (0-1 wraps around)
        h_dist = min(abs(h1 - h2), 1 - abs(h1 - h2)) * 2.0
        
        return h_dist + abs(s1 - s2) + abs(v1 - v2)

def main():
    url = "https://drinkag1.com/"
    extractor = ColorExtractor(url)
    colors = extractor.execute()
    
    html = f'<html><body style="margin:0;display:flex;height:100vh">'
    for color in colors['palette']:
        html += f'<div style="flex:1;background:{color}"></div>'
    html += '</body></html>'
    
    with open('palette.html', 'w') as f:
        f.write(html)

if __name__ == "__main__":
    main()