from urllib.parse import urljoin, urlparse
from utils.image_utils import save_image_supabase
from .utils import fetch_page

class ImageExtractor:
    
    def __init__(self, max_images=20):
        self.max_images = max_images
        
        # Keywords that indicate non-content images
        self.skip_keywords = {
            'icon', 'logo', 'button', 'arrow', 'social', 'share',
            'facebook', 'twitter', 'linkedin', 'instagram', 'youtube',
            'avatar', 'profile', 'badge', 'banner', 'ad', 'sponsor'
        }
        
        # Domains to skip (tracking/ads)
        self.skip_domains = {
            'doubleclick', 'google-analytics', 'facebook.com/tr',
            'adservice', 'adsystem', 'advertising', 'tracker', 'pixel'
        }
    
    def _should_skip(self, img, src):
        """Check if image should be skipped based on simple rules"""
        # Skip data URIs
        if src.startswith('data:'):
            return True
        
        # Skip tracking/ad domains
        src_lower = src.lower()
        if any(domain in src_lower for domain in self.skip_domains):
            return True
        
        # Check size attributes (skip small images)
        try:
            width = int(img.get('width', 0) or 0)
            height = int(img.get('height', 0) or 0)
            if (width > 0 and width < 100) or (height > 0 and height < 100):
                return True
        except (ValueError, TypeError):
            pass
        
        # Check for icon/social keywords in attributes
        attrs = ' '.join([
            str(img.get('src', '')),
            str(img.get('alt', '')),
            str(img.get('class', '')),
            str(img.get('id', ''))
        ]).lower()
        
        if any(keyword in attrs for keyword in self.skip_keywords):
            return True
        
        return False
    
    def _get_image_priority(self, img):
        """Simple priority scoring: higher = better"""
        priority = 0
        
        # Prefer images in main content areas
        if img.find_parent(['main', 'article']):
            priority += 3
        elif img.find_parent(['section']):
            priority += 2
        
        # Prefer images with descriptive alt text
        alt = img.get('alt', '').strip()
        if alt and len(alt) > 10:
            priority += 2
        
        # Prefer reasonable sizes
        try:
            width = int(img.get('width', 0) or 0)
            height = int(img.get('height', 0) or 0)
            if width >= 300 or height >= 300:
                priority += 1
        except (ValueError, TypeError):
            pass
        
        return priority
    
    def extract_images(self, url):
        """Extract relevant images from URL"""
        print(f"Extracting images from: {url}")
        soup, final_url = fetch_page(url)
        
        if not soup or not final_url:
            return []
        
        candidates = []
        
        for img in soup.find_all('img'):
            # Get image source (check both src and data-src)
            src = img.get('src') or img.get('data-src')
            if not src:
                continue
            
            # Convert to absolute URL
            img_url = urljoin(final_url, src)
            
            # Skip unwanted images
            if self._should_skip(img, img_url):
                continue
            
            # Calculate priority
            priority = self._get_image_priority(img)
            candidates.append((img_url, priority))
        
        # Sort by priority and take top images
        candidates.sort(key=lambda x: x[1], reverse=True)
        top_images = [url for url, _ in candidates[:self.max_images]]
        
        print(f"Selected {len(top_images)} images")
        return top_images
    
    def execute(self, url, user_id, storage_bucket='brand-images'):
        """Extract and upload images to Supabase"""
        image_urls = self.extract_images(url)
        
        if not image_urls:return []
         
        uploaded_urls = []
        domain = urlparse(url).netloc.replace("www.", "")
        folder_name = f"{user_id}/{domain}/images"
        
        for img_url in image_urls:
            try:
                result = save_image_supabase(storage_bucket, folder_name, img_url)
                if result.get('success'):
                    uploaded_urls.append(result.get('image_url'))
            except Exception as e:
                print(f"Error uploading {img_url}: {e}")
                continue
        
        print(f"Successfully uploaded {len(uploaded_urls)} images")
        return uploaded_urls