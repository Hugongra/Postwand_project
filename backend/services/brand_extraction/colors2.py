import re
import requests
import numpy as np
from PIL import Image
from sklearn.cluster import KMeans
from io import BytesIO
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from dotenv import load_dotenv
import sys
import os

# Handle imports for both module and standalone execution
try:
    from .utils import fetch_page, fetch_page_playwright
except ImportError:
    from utils import fetch_page, fetch_page_playwright

load_dotenv()
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

NEUTRAL_COLORS = ['#ffffff', '#000000']  # Only filter pure white and black

class ColorExtractor:
    def __init__(self, url, logo=None, max_colors=10, use_playwright=False):
        self.url = url
        self.logo = logo
        self.max_colors = max_colors
        self.use_playwright = use_playwright
        self.colors = {
            'logo_colors': [],
            'element_colors': [],
            'css_colors': [],
            'palette': []
        }

    # ------------------------
    # Helpers
    # ------------------------
    @staticmethod
    def is_valid_hex(color):
        return bool(re.match(r'^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$', color))

    @staticmethod
    def get_image(url):
        try:
            resp = requests.get(url, timeout=10)
            resp.raise_for_status()
            return Image.open(BytesIO(resp.content))
        except:
            return None

    @staticmethod
    def resize_image(img, max_dim=400):
        if img.width > max_dim or img.height > max_dim:
            ratio = min(max_dim / img.width, max_dim / img.height)
            return img.resize((int(img.width*ratio), int(img.height*ratio)), Image.LANCZOS)
        return img

    @staticmethod
    def to_rgb(img):
        if img.mode == 'RGBA':
            bg = Image.new('RGBA', img.size, (255,255,255))
            return Image.alpha_composite(bg, img).convert('RGB')
        return img.convert('RGB')

    @staticmethod
    def rgb_to_hex(rgb):
        return f"#{int(rgb[0]):02x}{int(rgb[1]):02x}{int(rgb[2]):02x}"

    # ------------------------
    # Logo colors
    # ------------------------
    def extract_logo_colors(self, num_colors=5):
        if not self.logo:
            return []
        img = self.get_image(self.logo)
        if not img:
            return []
        img = self.resize_image(img)
        img = self.to_rgb(img)
        pixels = np.array(img).reshape(-1,3)
        sample = pixels[np.random.choice(len(pixels), min(len(pixels),5000), replace=False)]
        k = min(num_colors, len(sample))
        kmeans = KMeans(n_clusters=k, n_init=10, random_state=42).fit(sample)
        colors = [self.rgb_to_hex(c) for c in kmeans.cluster_centers_]
        self.colors['logo_colors'] = [c for c in colors if c not in NEUTRAL_COLORS]
        return self.colors['logo_colors']

    # ------------------------
    # Key element colors
    # ------------------------
    def extract_element_colors(self):
        if self.use_playwright:
            soup, final_url = fetch_page_playwright(self.url, wait=2)
        else:
            soup, final_url = fetch_page(self.url)
        
        if not soup:
            print(f"   ⚠️  Could not fetch page content")
            return []

        colors = set()
        # Check all elements with style attributes
        for tag in soup.find_all(style=True):
            style = tag.get('style', '')
            matches = re.findall(r'#[0-9A-Fa-f]{3,6}', style)
            for m in matches:
                if len(m)==4:
                    m=f"#{m[1]*2}{m[2]*2}{m[3]*2}"
                if self.is_valid_hex(m) and m.lower() not in NEUTRAL_COLORS:
                    colors.add(m.lower())
        
        # Also check specific selectors
        for selector in ['.btn', '.button', '.primary', '.header', 'h1','h2','h3','nav','header','footer']:
            for tag in soup.select(selector):
                style = tag.get('style','')
                matches = re.findall(r'#[0-9A-Fa-f]{3,6}', style)
                for m in matches:
                    if len(m)==4:
                        m=f"#{m[1]*2}{m[2]*2}{m[3]*2}"
                    if self.is_valid_hex(m) and m.lower() not in NEUTRAL_COLORS:
                        colors.add(m.lower())
        
        self.colors['element_colors'] = list(colors)
        return self.colors['element_colors']

    # ------------------------
    # CSS colors
    # ------------------------
    def extract_css_colors(self):
        if self.use_playwright:
            soup, _ = fetch_page_playwright(self.url, wait=2)
        else:
            soup, _ = fetch_page(self.url)
        
        if not soup:
            print(f"   ⚠️  Could not fetch page content")
            return []

        css_text = ""
        style_count = 0
        
        # Extract inline styles
        for tag in soup.find_all('style'):
            css_text += tag.get_text() + " "
            style_count += 1
        
        for tag in soup.find_all(style=True):
            css_text += tag['style'] + " "
        
        # Extract external stylesheets
        link_count = 0
        for link in soup.find_all('link', rel='stylesheet'):
            if link.get('href'):
                try:
                    css_url = urljoin(self.url, link['href'])
                    print(f"      Fetching CSS: {css_url[:80]}...")
                    r = requests.get(css_url, timeout=10)
                    if r.status_code==200:
                        css_text += r.text + " "
                        link_count += 1
                except Exception as e:
                    print(f"      Failed to fetch CSS: {e}")
                    pass

        print(f"      Found {style_count} inline styles, {link_count} external CSS files")
        
        # Extract hex colors
        hex_colors = re.findall(r'#[0-9A-Fa-f]{3,6}', css_text)
        colors = []
        for c in hex_colors:
            if len(c)==4:
                c=f"#{c[1]*2}{c[2]*2}{c[3]*2}"
            c=c.lower()
            if self.is_valid_hex(c) and c not in NEUTRAL_COLORS:
                colors.append(c)
        
        self.colors['css_colors'] = list(set(colors))
        print(f"      Extracted {len(hex_colors)} total hex codes, {len(self.colors['css_colors'])} unique non-neutral colors")
        return self.colors['css_colors']

    # ------------------------
    # Generate final palette
    # ------------------------
    def generate_palette(self):
        palette=[]
        for source in ['logo_colors','element_colors','css_colors']:
            for c in self.colors[source]:
                if c not in palette:
                    palette.append(c)
                if len(palette)>=self.max_colors:
                    break
            if len(palette)>=self.max_colors:
                break
        self.colors['palette'] = palette
        return palette

    # ------------------------
    # Execute all
    # ------------------------
    def execute(self):
        self.extract_logo_colors()
        self.extract_element_colors()
        self.extract_css_colors()
        self.generate_palette()
        return self.colors


def generate_html_palette(colors, url, output_file='color_palette.html'):
    """Generate an HTML file to visualize the extracted color palette."""
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Color Palette Viewer</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 20px;
            min-height: 100vh;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            padding: 40px;
        }}
        h1 {{
            color: #333;
            margin-bottom: 10px;
            font-size: 2.5em;
        }}
        .url-info {{
            color: #666;
            margin-bottom: 30px;
            font-size: 0.9em;
            word-break: break-all;
        }}
        .section {{
            margin-bottom: 40px;
        }}
        .section h2 {{
            color: #444;
            margin-bottom: 20px;
            font-size: 1.5em;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
        }}
        .color-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }}
        .color-card {{
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            transition: transform 0.2s, box-shadow 0.2s;
            cursor: pointer;
        }}
        .color-card:hover {{
            transform: translateY(-5px);
            box-shadow: 0 8px 12px rgba(0,0,0,0.2);
        }}
        .color-box {{
            height: 120px;
            width: 100%;
            position: relative;
        }}
        .color-info {{
            padding: 15px;
            background: #f9f9f9;
            text-align: center;
        }}
        .color-hex {{
            font-family: 'Courier New', monospace;
            font-weight: bold;
            font-size: 1em;
            color: #333;
        }}
        .color-rgb {{
            font-size: 0.8em;
            color: #666;
            margin-top: 5px;
        }}
        .empty-state {{
            color: #999;
            font-style: italic;
            padding: 20px;
            text-align: center;
            background: #f5f5f5;
            border-radius: 8px;
        }}
        .stats {{
            display: flex;
            justify-content: space-around;
            margin-bottom: 30px;
            flex-wrap: wrap;
            gap: 20px;
        }}
        .stat-card {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px 30px;
            border-radius: 10px;
            text-align: center;
            min-width: 150px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }}
        .stat-number {{
            font-size: 2em;
            font-weight: bold;
            margin-bottom: 5px;
        }}
        .stat-label {{
            font-size: 0.9em;
            opacity: 0.9;
        }}
        .copied-notification {{
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4caf50;
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.2);
            display: none;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        }}
        @keyframes slideIn {{
            from {{
                transform: translateX(400px);
                opacity: 0;
            }}
            to {{
                transform: translateX(0);
                opacity: 1;
            }}
        }}
    </style>
</head>
<body>
    <div class="copied-notification" id="notification">Color copied to clipboard!</div>
    <div class="container">
        <h1>🎨 Color Palette Extractor</h1>
        <div class="url-info">Extracted from: <strong>{url}</strong></div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">{len(colors.get('logo_colors', []))}</div>
                <div class="stat-label">Logo Colors</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">{len(colors.get('element_colors', []))}</div>
                <div class="stat-label">Element Colors</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">{len(colors.get('css_colors', []))}</div>
                <div class="stat-label">CSS Colors</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">{len(colors.get('palette', []))}</div>
                <div class="stat-label">Final Palette</div>
            </div>
        </div>
"""
    
    # Helper function to convert hex to RGB
    def hex_to_rgb(hex_color):
        hex_color = hex_color.lstrip('#')
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    
    # Function to render color section
    def render_section(title, color_list):
        if not color_list:
            return f"""
        <div class="section">
            <h2>{title}</h2>
            <div class="empty-state">No colors found in this category</div>
        </div>
"""
        
        cards_html = ""
        for color in color_list:
            rgb = hex_to_rgb(color)
            cards_html += f"""
            <div class="color-card" onclick="copyToClipboard('{color}')">
                <div class="color-box" style="background-color: {color};"></div>
                <div class="color-info">
                    <div class="color-hex">{color.upper()}</div>
                    <div class="color-rgb">RGB({rgb[0]}, {rgb[1]}, {rgb[2]})</div>
                </div>
            </div>
"""
        
        return f"""
        <div class="section">
            <h2>{title}</h2>
            <div class="color-grid">
                {cards_html}
            </div>
        </div>
"""
    
    # Add sections
    html_content += render_section("🎯 Final Palette", colors.get('palette', []))
    html_content += render_section("🖼️ Logo Colors", colors.get('logo_colors', []))
    html_content += render_section("🎨 Element Colors", colors.get('element_colors', []))
    html_content += render_section("📄 CSS Colors", colors.get('css_colors', []))
    
    # Close HTML
    html_content += """
    </div>
    
    <script>
        function copyToClipboard(color) {
            navigator.clipboard.writeText(color).then(() => {
                const notification = document.getElementById('notification');
                notification.style.display = 'block';
                setTimeout(() => {
                    notification.style.display = 'none';
                }, 2000);
            });
        }
    </script>
</body>
</html>
"""
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    return output_file


if __name__ == "__main__":
    # Test with real postwand.io website
    print("🎨 Color Extractor Test")
    print("=" * 60)
    
    test_url = "https://postwand.io"
    
    print(f"\n🔍 Extracting colors from: {test_url}")
    print("   Using Playwright for JS rendering...")
    print("   This may take a moment...\n")
    
    # Create extractor instance (use Playwright for JS-heavy sites like postwand.io)
    extractor = ColorExtractor(url=test_url, max_colors=20, use_playwright=True)
    
    # Execute extraction
    print("⏳ Extracting logo colors...")
    logo_colors = extractor.extract_logo_colors()
    print(f"   ✓ Found {len(logo_colors)} logo colors: {logo_colors}")
    
    print("\n⏳ Extracting element colors...")
    element_colors = extractor.extract_element_colors()
    print(f"   ✓ Found {len(element_colors)} element colors: {element_colors}")
    
    print("\n⏳ Extracting CSS colors...")
    css_colors = extractor.extract_css_colors()
    print(f"   ✓ Found {len(css_colors)} CSS colors: {css_colors[:10]}...")  # Show first 10
    
    print("\n⏳ Generating final palette...")
    palette = extractor.generate_palette()
    print(f"   ✓ Final palette ({len(palette)} colors): {palette}")
    
    # Get all colors
    all_colors = extractor.colors
    
    print("\n" + "=" * 60)
    print("📊 Summary:")
    print(f"   Logo Colors: {len(all_colors['logo_colors'])}")
    print(f"   Element Colors: {len(all_colors['element_colors'])}")
    print(f"   CSS Colors: {len(all_colors['css_colors'])}")
    print(f"   Final Palette: {len(all_colors['palette'])}")
    
    # Generate HTML visualization
    print("\n⏳ Generating HTML visualization...")
    html_file = generate_html_palette(all_colors, test_url)
    print(f"✅ HTML file created: {html_file}")
    print(f"\n🌐 Opening in browser...")
    print(f"   File location: {os.path.abspath(html_file)}")
    
    # Auto-open in browser
    import webbrowser
    webbrowser.open('file://' + os.path.abspath(html_file))
