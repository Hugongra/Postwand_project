import requests
from bs4 import BeautifulSoup
import re
import os
import uuid
from urllib.parse import urljoin, urlparse
import io

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

def extract_logo(url):
    """
    Extract logo candidates from a website, including both images and SVGs.
    """
    # Get BeautifulSoup object
    soup = get_soup(url)
    
    # Common patterns for logo elements
    logo_candidates = []
    
    # Method 1: Look for elements with 'logo' in id or class
    logo_elements = soup.find_all(lambda tag: tag.name and 
                              (('logo' in tag.get('id', '').lower()) or 
                               ('logo' in ' '.join(tag.get('class', [])).lower())))
    
    # Method 2: Look for image elements with 'logo' in src, alt or title
    img_elements = soup.find_all('img')
    logo_imgs = [img for img in img_elements if any(
        'logo' in img.get(attr, '').lower() for attr in ['src', 'alt', 'title'])]
    
    # Method 3: Look for SVG elements
    svg_elements = soup.find_all('svg')
    svg_logo = [svg for svg in svg_elements if svg.get('id') and 'logo' in svg.get('id').lower()]
    if not svg_logo:
        svg_logo = [svg for svg in svg_elements if svg.get('class') and 
                    'logo' in ' '.join(svg.get('class', [])).lower()]
    
    # Method 4: Look for object/embed elements with SVG
    svg_objects = soup.find_all(['object', 'embed'], attrs={'type': 'image/svg+xml'})
    
    # Combine candidates
    logo_candidates.extend(logo_elements)
    logo_candidates.extend(logo_imgs)
    logo_candidates.extend(svg_logo)
    logo_candidates.extend(svg_objects)
    
    # If no explicit logo found, try common locations
    if not logo_candidates:
        # Look in header
        header = soup.find('header')
        if header:
            logo_candidates.extend(header.find_all('img'))
            logo_candidates.extend(header.find_all('svg'))
        
        # Look for first image in navbar
        navbar = soup.find(class_=re.compile('nav|navbar|menu'))
        if navbar:
            if navbar.find('img'):
                logo_candidates.append(navbar.find('img'))
            if navbar.find('svg'):
                logo_candidates.append(navbar.find('svg'))
    
    # Process candidates to get image URLs or SVG content
    logo_urls = []
    svg_contents = []
    
    for candidate in logo_candidates:
        # If element is directly an image
        if candidate.name == 'img' and candidate.get('src'):
            logo_urls.append(urljoin(url, candidate.get('src')))
        
        # If element is an SVG
        elif candidate.name == 'svg':
            svg_contents.append(str(candidate))
        
        # If element is an object/embed with SVG
        elif candidate.name in ['object', 'embed'] and candidate.get('data'):
            svg_url = urljoin(url, candidate.get('data'))
            if svg_url.endswith('.svg'):
                logo_urls.append(svg_url)
        
        # If element contains images or SVGs
        else:
            for img in candidate.find_all('img'):
                if img.get('src'):
                    logo_urls.append(urljoin(url, img.get('src')))
            
            for svg in candidate.find_all('svg'):
                svg_contents.append(str(svg))
    
    # Remove duplicates while preserving order
    unique_logo_urls = []
    for logo_url in logo_urls:
        if logo_url not in unique_logo_urls:
            unique_logo_urls.append(logo_url)
    
    return {'urls': unique_logo_urls, 'svg_contents': svg_contents}

def download_image(url):
    """Download image from URL and return bytes"""
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        return response.content
    except Exception as e:
        print(f"Error downloading image from {url}: {e}")
        return None

def get_file_extension(url):
    """Get file extension from URL"""
    parsed = urlparse(url)
    path = parsed.path
    extension = os.path.splitext(path)[1]
    return extension[1:] if extension else 'png'  # Default to png if no extension

def get_content_type(url):
    """Get content type based on URL"""
    ext = get_file_extension(url)
    content_types = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'svg': 'image/svg+xml',
        'webp': 'image/webp'
    }
    return content_types.get(ext.lower(), 'image/png')

def upload_logo_to_supabase(url, supabase_client, user_id):
    """Modified function to print detailed debugging information"""
    try:
        # Extract logo URLs and SVGs
        extraction_results = extract_logo(url)
        logo_urls = extraction_results['urls']
        
        if not logo_urls:
            print("No logo URLs found")
            return None
            
        print(f"Found logo URLs: {logo_urls}")
        
        # Download the first logo
        logo_url = logo_urls[0]
        print(f"Attempting to download logo from: {logo_url}")
        
        image_data = download_image(logo_url)
        if not image_data:
            print("Failed to download logo image")
            return None
            
        print(f"Downloaded logo image ({len(image_data)} bytes)")
        
        # Generate filename and path
        domain = urlparse(url).netloc.replace("www.", "")
        file_extension = get_file_extension(logo_url)
        filename = f"logo_{domain}_{uuid.uuid4()}.{file_extension}"
        storage_path = f"{user_id}/{filename}"
        
        print(f"Uploading to storage path: {storage_path}")
        
        # Upload to Supabase with explicit error handling
        try:
            result = supabase_client.storage.from_('brand-images').upload(
                storage_path,
                image_data,
                file_options={"content-type": get_content_type(logo_url)}
            )
            print(f"Upload result: {result}")
            
            # Get public URL
            public_url = supabase_client.storage.from_('brand-images').get_public_url(storage_path)
            print(f"Public URL: {public_url}")
            return public_url
        except Exception as e:
            print(f"Supabase upload error: {e}")
            # Try one more time with explicit mimetype
            try:
                content_type = get_content_type(logo_url)
                print(f"Retrying with explicit content type: {content_type}")
                result = supabase_client.storage.from_('brand-images').upload(
                    storage_path,
                    image_data,
                    file_options={"content-type": content_type}
                )
                public_url = supabase_client.storage.from_('brand-images').get_public_url(storage_path)
                return public_url
            except Exception as e2:
                print(f"Second upload attempt failed: {e2}")
                return None
    except Exception as e:
        print(f"Error in upload_logo_to_supabase: {e}")
        return None

def upload_logo_with_fallback(url, supabase_client, user_id):
    """
    Extract and upload logo with fallback mechanisms directly to Supabase.
    If the main extraction fails, try common logo paths.
    """
    try:
        logo_url = upload_logo_to_supabase(url, supabase_client, user_id)
        
        if logo_url:
            return logo_url
        
        # Fallback: Try to look for logos in common paths
        domain = urlparse(url).netloc
        common_logo_paths = [
            '/logo.svg',
            '/images/logo.svg',
            '/assets/logo.svg',
            '/img/logo.svg',
            '/static/logo.svg',
            '/logo.png',
            '/images/logo.png',
            '/assets/logo.png',
            '/img/logo.png',
            '/static/logo.png',
            '/favicon.ico'  # Sometimes the favicon is the logo
        ]
        
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        base_url = f"{urlparse(url).scheme}://{urlparse(url).netloc}"
        
        # Generate storage path base
        storage_path_base = f"{user_id}/brand_assets"
        domain_name = urlparse(url).netloc.replace("www.", "")
        
        for path in common_logo_paths:
            logo_url = urljoin(base_url, path)
            try:
                response = requests.head(logo_url, headers=headers, timeout=5)
                if response.status_code == 200:
                    # Found a potential logo at a common path
                    file_extension = os.path.splitext(path)[1]
                    if not file_extension:
                        file_extension = '.png'
                        
                    # Generate a unique filename
                    filename = f"logo_{domain_name}_{uuid.uuid4()}{file_extension}"
                    storage_path = f"{storage_path_base}/{filename}"
                    
                    # Download the logo
                    img_response = requests.get(logo_url, headers=headers, timeout=10)
                    img_response.raise_for_status()
                    
                    # Get content type
                    content_type = img_response.headers.get('Content-Type', f'image/{file_extension[1:]}')
                    
                    # Upload to Supabase
                    supabase_client.storage.from_('brand-images').upload(
                        storage_path,
                        img_response.content,
                        file_options={"content-type": content_type}
                    )
                    
                    # Get the public URL
                    saved_logo_url = supabase_client.storage.from_('brand-images').get_public_url(storage_path)
                    print(f"Logo found at common path and uploaded to Supabase: {saved_logo_url}")
                    return saved_logo_url
            except:
                continue
        
        print("No logo found even after trying common paths")
        return None
    
    except Exception as e:
        print(f"Error in upload_logo_with_fallback: {e}")
        return None

def extract_all_images(url):
    """
    Extract all image URLs from a website, excluding logo images.
    """
    # Get BeautifulSoup object
    soup = get_soup(url)
    
    # First, extract logo candidates to exclude them
    extraction_results = extract_logo(url)
    logo_urls = extraction_results['urls']
    
    # Find all image elements
    all_images = []
    for img in soup.find_all('img'):
        if img.get('src'):
            img_url = urljoin(url, img.get('src'))
            # Print out the image URL for debugging
            print(f"Found image: {img_url} (from src: {img.get('src')})")
            # Check if this is not a logo image
            if img_url not in logo_urls and not any(
                'logo' in str(img.get(attr, '')).lower() for attr in ['src', 'alt', 'title', 'class', 'id']
            ):
                all_images.append({
                    'url': img_url,
                    'alt': img.get('alt', ''),
                    'dimensions': (img.get('width', ''), img.get('height', ''))
                })
    
    return all_images

def upload_all_images(url, supabase_client, user_id, max_images=20):
    """
    Extract and upload all images from a website (excluding logos) directly to Supabase.
    Returns a list of URLs to the uploaded image files.
    """
    # Get domain name for the filename
    domain = urlparse(url).netloc.replace("www.", "")
    print(f"Using domain for file naming: {domain}")
    
    try:
        # Extract all images excluding logos
        all_images = extract_all_images(url)
        
        if not all_images:
            print(f"No non-logo images found on {url}")
            return []
        
        # Limit the number of images to upload
        images_to_download = all_images[:max_images]
        uploaded_urls = []
        
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        storage_path_base = f"{user_id}/brand_assets"
        
        for i, img_data in enumerate(images_to_download):
            img_url = img_data['url']
            print(f"Attempting to upload image {i+1}/{len(images_to_download)}: {img_url}")
            
            # Extract file extension or default to .jpg
            file_extension = os.path.splitext(urlparse(img_url).path)[1]
            if not file_extension or len(file_extension) > 5:  # Avoid invalid extensions
                file_extension = '.jpg'
            
            # Generate a unique filename
            img_filename = f"image_{domain}_{i}_{uuid.uuid4()}{file_extension}"
            storage_path = f"{storage_path_base}/{img_filename}"
            
            try:
                img_response = requests.get(img_url, headers=headers, timeout=10)
                img_response.raise_for_status()
                
                # Check if content is actually an image
                content_type = img_response.headers.get('Content-Type', '')
                print(f"Content type: {content_type}")
                if not content_type.startswith('image/'):
                    print(f"Skipping non-image content: {img_url}")
                    continue
                
                # Upload to Supabase
                supabase_client.storage.from_('brand-images').upload(
                    storage_path,
                    img_response.content,
                    file_options={"content-type": content_type}
                )
                
                # Get the public URL
                saved_img_url = supabase_client.storage.from_('brand-images').get_public_url(storage_path)
                print(f"Image uploaded to Supabase: {saved_img_url}")
                uploaded_urls.append(saved_img_url)
                
            except requests.RequestException as e:
                print(f"Error downloading/uploading image from {img_url}: {e}")
                continue
        
        return uploaded_urls
    
    except Exception as e:
        print(f"Error extracting images: {e}")
        return []

def extract_website_assets(url, supabase_client, user_id, image_limit=20):
    """
    Extract both logo and all other images from a website and upload directly to Supabase.
    Returns a dictionary with URLs to the uploaded logo and other images.
    """
    try:
        normalized_url = normalize_url(url)
        
        # Extract and upload logo
        print("Extracting and uploading logo...")
        logo_url = upload_logo_with_fallback(normalized_url, supabase_client, user_id)
        
        # Extract and upload all other images
        print("Extracting and uploading other images...")
        image_urls = upload_all_images(normalized_url, supabase_client, user_id, max_images=image_limit)
        
        return {
            "logo": logo_url,
            "images": image_urls
        }
    except Exception as e:
        print(f"Error extracting website assets: {e}")
        return {"logo": None, "images": []}

# Update example usage
if __name__ == "__main__":
    # This would need to be modified for local testing without Supabase
    print("This module is designed to be used with a Supabase client, not directly.")