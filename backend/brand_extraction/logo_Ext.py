import requests
from bs4 import BeautifulSoup
import re
import os
from urllib.parse import urljoin, urlparse

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

def download_logo(url, output_dir="logos"):
    """
    Download logo from a website to the specified output directory.
    Returns the path to the downloaded logo file, or None if no logo was found.
    """
    # Create output directory if it doesn't exist
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # Get domain name for the output filename
    domain = urlparse(url).netloc.replace("www.", "")
    
    try:
        # Extract logo URLs and SVGs
        extraction_results = extract_logo(url)
        logo_urls = extraction_results['urls']
        svg_contents = extraction_results['svg_contents']
        
        # Process SVGs first (they're usually better quality)
        if svg_contents:
            svg_filename = os.path.join(output_dir, f"{domain}_logo.svg")
            with open(svg_filename, 'w', encoding='utf-8') as f:
                f.write(svg_contents[0])
            print(f"SVG logo saved to {svg_filename}")
            return svg_filename
        
        # If no SVGs, try image URLs
        if logo_urls:
            # Download the first logo (most likely candidate)
            logo_url = logo_urls[0]
            file_extension = os.path.splitext(urlparse(logo_url).path)[1]
            if not file_extension:
                file_extension = '.png'  # Default extension
            
            filename = os.path.join(output_dir, f"{domain}_logo{file_extension}")
            
            try:
                headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
                img_response = requests.get(logo_url, headers=headers, stream=True, timeout=10)
                img_response.raise_for_status()
                
                with open(filename, 'wb') as f:
                    for chunk in img_response.iter_content(1024):
                        f.write(chunk)
                print(f"Logo downloaded to {filename}")
                return filename
            except requests.RequestException as e:
                print(f"Error downloading logo from {logo_url}: {e}")
                
                # Try the next URL if available
                if len(logo_urls) > 1:
                    for next_url in logo_urls[1:]:
                        try:
                            img_response = requests.get(next_url, headers=headers, stream=True, timeout=10)
                            img_response.raise_for_status()
                            
                            filename = os.path.join(output_dir, f"{domain}_logo{os.path.splitext(urlparse(next_url).path)[1] or '.png'}")
                            with open(filename, 'wb') as f:
                                for chunk in img_response.iter_content(1024):
                                    f.write(chunk)
                            print(f"Logo downloaded to {filename}")
                            return filename
                        except:
                            continue
                
                return None
        
        # If no logo found
        print(f"No logo found on {url}")
        return None
    
    except Exception as e:
        print(f"Error extracting logo: {e}")
        return None

def extract_logos_with_fallback(url):
    """
    Extract logos with fallback mechanisms.
    If the main extraction fails, try common logo paths.
    """
    try:
        logo_path = download_logo(url)
        
        if logo_path:
            return logo_path
        
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
        
        for path in common_logo_paths:
            logo_url = urljoin(base_url, path)
            try:
                response = requests.head(logo_url, headers=headers, timeout=5)
                if response.status_code == 200:
                    # Found a potential logo at a common path
                    output_dir = "logos"
                    if not os.path.exists(output_dir):
                        os.makedirs(output_dir)
                    
                    domain_name = urlparse(url).netloc.replace("www.", "")
                    file_extension = os.path.splitext(path)[1]
                    filename = os.path.join(output_dir, f"{domain_name}_logo{file_extension}")
                    
                    # Download the logo
                    img_response = requests.get(logo_url, headers=headers, stream=True, timeout=10)
                    img_response.raise_for_status()
                    
                    with open(filename, 'wb') as f:
                        for chunk in img_response.iter_content(1024):
                            f.write(chunk)
                    print(f"Logo found at common path and downloaded to {filename}")
                    return filename
            except:
                continue
        
        print("No logo found even after trying common paths")
        return None
    
    except Exception as e:
        print(f"Error in extract_logos_with_fallback: {e}")
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

def download_all_images(url, output_dir="website_images", max_images=20):
    """
    Download all images from a website (excluding logos) to the specified output directory.
    Returns a list of paths to the downloaded image files.
    """
    # Create output directory if it doesn't exist
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # Get domain name for the output filename
    domain = urlparse(url).netloc.replace("www.", "")
    print(f"Using domain for file naming: {domain}")
    
    try:
        # Extract all images excluding logos
        all_images = extract_all_images(url)
        
        if not all_images:
            print(f"No non-logo images found on {url}")
            return []
        
        # Limit the number of images to download
        images_to_download = all_images[:max_images]
        downloaded_paths = []
        
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        
        for i, img_data in enumerate(images_to_download):
            img_url = img_data['url']
            print(f"Attempting to download image {i+1}/{len(images_to_download)}: {img_url}")
            
            # Extract file extension or default to .jpg
            file_extension = os.path.splitext(urlparse(img_url).path)[1]
            if not file_extension or len(file_extension) > 5:  # Avoid invalid extensions
                file_extension = '.jpg'
            
            filename = os.path.join(output_dir, f"{domain}_image_{i}{file_extension}")
            
            try:
                img_response = requests.get(img_url, headers=headers, stream=True, timeout=10)
                img_response.raise_for_status()
                
                # Check if content is actually an image
                content_type = img_response.headers.get('Content-Type', '')
                print(f"Content type: {content_type}")
                if not content_type.startswith('image/'):
                    print(f"Skipping non-image content: {img_url}")
                    continue
                
                with open(filename, 'wb') as f:
                    for chunk in img_response.iter_content(1024):
                        f.write(chunk)
                print(f"Image downloaded to {filename}")
                downloaded_paths.append(filename)
            except requests.RequestException as e:
                print(f"Error downloading image from {img_url}: {e}")
                continue
        
        return downloaded_paths
    
    except Exception as e:
        print(f"Error extracting images: {e}")
        return []

def extract_website_assets(url, image_limit=20):
    """
    Extract both logo and all other images from a website.
    Returns a dictionary with paths to the logo and other images.
    """
    try:
        normalized_url = normalize_url(url)
        
        # Extract logo
        print("Extracting logo...")
        logo_path = extract_logos_with_fallback(normalized_url)
        
        # Extract all other images
        print("Extracting other images...")
        image_paths = download_all_images(normalized_url, max_images=image_limit)
        
        return {
            "logo": logo_path,
            "images": image_paths
        }
    except Exception as e:
        print(f"Error extracting website assets: {e}")
        return {"logo": None, "images": []}

# Update example usage
if __name__ == "__main__":
    website_url = input("Enter the website URL to extract assets from: ")
    normalized_url = normalize_url(website_url)
    
    # Option selection
    print("\nSelect operation:")
    print("1. Extract logo only")
    print("2. Extract all images (excluding logo)")
    print("3. Extract both logo and all images")
    
    choice = input("Enter your choice (1-3): ")
    
    if choice == '1':
        logo_path = extract_logos_with_fallback(normalized_url)
        if logo_path:
            print(f"Successfully extracted logo to: {logo_path}")
        else:
            print("Could not extract logo from the provided website.")
    
    elif choice == '2':
        image_paths = download_all_images(normalized_url)
        if image_paths:
            print(f"Successfully extracted {len(image_paths)} images.")
        else:
            print("Could not extract any images from the provided website.")
    
    elif choice == '3':
        assets = extract_website_assets(normalized_url)
        if assets["logo"]:
            print(f"Successfully extracted logo to: {assets['logo']}")
        else:
            print("Could not extract logo from the provided website.")
        
        if assets["images"]:
            print(f"Successfully extracted {len(assets['images'])} images.")
        else:
            print("Could not extract any additional images from the provided website.")
    
    else:
        print("Invalid choice. Please run the script again and select a valid option.")