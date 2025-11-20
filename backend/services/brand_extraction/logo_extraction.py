import requests
from urllib.parse import urljoin, urlparse
from .utils import fetch_page
from utils.image_utils import save_image_supabase


class LogoExtractor:
    
    def __init__(self):
        self.social_keywords = [
            'facebook', 'twitter', 'linkedin', 'instagram',
            'youtube', 'tiktok', 'pinterest', 'social',
            'share', 'follow'
        ]
        
        self.social_domains = [
            'facebook.com', 'twitter.com', 'linkedin.com',
            'instagram.com', 'youtube.com', 'tiktok.com'
        ]
    
    def _extract_image_url(self, element, base_url):
        """Extract image URL from img or svg element"""
        if element.name == 'img':
            src = element.get('src') or element.get('data-src')
            if src:
                return urljoin(base_url, src)
        elif element.name == 'svg':
            parent = element.find_parent(['object', 'embed'])
            if parent and parent.get('data'):
                return urljoin(base_url, parent.get('data'))
        
        return None
    
    def _is_social_icon(self, element):
        """Check if element is a social media icon"""
        # Check element attributes
        attrs_text = ' '.join([
            str(element.get('src', '')),
            str(element.get('alt', '')),
            str(element.get('class', '')),
            str(element.get('id', '')),
            str(element.get('title', ''))
        ]).lower()
        
        if any(keyword in attrs_text for keyword in self.social_keywords):
            return True
        
        # Check parent link
        parent_link = element.find_parent('a')
        if parent_link:
            href = parent_link.get('href', '').lower()
            if any(domain in href for domain in self.social_domains):
                return True
        
        return False
    
    def find_logo_by_attributes(self, soup, base_url):
        """Find logo by searching for logo-related attributes"""
        selectors = [
            'img[class*="logo"]',
            'img[id*="logo"]',
            'img[alt*="logo" i]',
            'img[alt*="brand" i]',
            'img[src*="logo"]',
            'svg[class*="logo"]',
            'svg[id*="logo"]',
        ]
        
        for selector in selectors:
            for elem in soup.select(selector):
                if self._is_social_icon(elem):
                    continue
                
                url = self._extract_image_url(elem, base_url)
                if url:
                    print(f"Found logo via attribute selector: {selector}")
                    return url
        
        return None
    
    def find_logo_by_location(self, soup, base_url):
        """Find logo by searching typical header/nav locations"""
        containers = ['header', 'nav', '[class*="header"]', '[class*="navbar"]']
        
        for container in containers:
            for section in soup.select(container):
                # Check homepage links first
                homepage_links = section.select('a[href="/"], a[href="./"], a[href*="index"]')
                for link in homepage_links:
                    img = link.find('img')
                    if img and not self._is_social_icon(img):
                        url = self._extract_image_url(img, base_url)
                        if url:
                            print(f"Found logo in homepage link within {container}")
                            return url
                
                # Check first image in section
                img = section.find('img')
                if img and not self._is_social_icon(img):
                    url = self._extract_image_url(img, base_url)
                    if url:
                        print(f"Found logo as first image in {container}")
                        return url
        
        return None
    
    def find_logo_by_size(self, soup, base_url):
        """Find logo using size heuristics"""
        candidates = []
        
        for img in soup.find_all('img'):
            if self._is_social_icon(img):
                continue
            
            try:
                width = int(img.get('width', 0) or 0)
                height = int(img.get('height', 0) or 0)
                
                # Skip very small images
                if (width > 0 and width < 30) or (height > 0 and height < 30):
                    continue
                
                # Skip very large images (likely banners)
                if width > 800 or height > 600:
                    continue
                
                # Check aspect ratio (most logos are between 1:3 and 3:1)
                if width > 0 and height > 0:
                    aspect_ratio = width / height
                    if 0.33 <= aspect_ratio <= 3:
                        url = self._extract_image_url(img, base_url)
                        if url:
                            candidates.append((url, width * height))
            except (ValueError, TypeError):
                pass
        
        # Return largest candidate
        if candidates:
            candidates.sort(key=lambda x: x[1], reverse=True)
            print(f"Found logo by size heuristics")
            return candidates[0][0]
        
        return None
    
    def try_common_paths(self, base_url):
        """Try common logo file paths"""
        domain = urlparse(base_url).netloc.replace('www.', '')
        
        common_paths = [
            '/logo.svg',
            '/logo.png',
            '/images/logo.svg',
            '/images/logo.png',
            '/assets/logo.svg',
            '/assets/logo.png',
            '/img/logo.svg',
            '/img/logo.png',
            '/static/logo.svg',
            '/static/logo.png',
            f'/images/{domain}-logo.png',
            f'/images/{domain}-logo.svg',
        ]
        
        for path in common_paths:
            url = urljoin(base_url, path)
            try:
                response = requests.head(url, timeout=5)
                if response.status_code == 200:
                    print(f"Found logo at common path: {path}")
                    return url
            except requests.RequestException:
                continue
        
        return None
    
    def extract_logo(self, url):
        """Extract logo URL from website"""
        soup, final_url = fetch_page(url)
        if not soup or not final_url:
            return None
        
        # Try methods in order of reliability
        methods = [
            ("Attributes", lambda: self.find_logo_by_attributes(soup, final_url)),
            ("Location", lambda: self.find_logo_by_location(soup, final_url)),
            ("Size Heuristics", lambda: self.find_logo_by_size(soup, final_url)),
            ("Common Paths", lambda: self.try_common_paths(final_url)),
        ]
        
        for method_name, method in methods:
            print(f"\nTrying method: {method_name}")
            result = method()
            if result:
                print(f"✓ Success! Logo found: {result}")
                return result
        
        print(f"\n✗ No logo found after trying all methods")
        return None
    
    def execute(self, url, user_id, storage_bucket='brand-images'):
        """Extract and upload logo to Supabase"""
        logo = self.extract_logo(url)
        if not logo:
            return None
        
        domain = urlparse(url).netloc.replace("www.", "")
        folder_name = f"{user_id}/{domain}/logos"
        result = save_image_supabase(storage_bucket, folder_name, logo)
        
        return result.get('image_url') if result.get('success') else None