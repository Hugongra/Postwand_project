import json
import sys
import os
import re
import time
from urllib.parse import urlparse, urljoin
from bs4 import BeautifulSoup
from dotenv import load_dotenv

# Load environment variables and set project root
load_dotenv()
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

from backend.services.brand_extraction.utils import fetch_page, fetch_page_playwright
from backend.models.chat.controller import ChatController


class SmartProductExtractorAI:
    def __init__(self, max_products=50, max_depth=2, use_playwright=True):
        self.max_products = max_products
        self.max_depth = max_depth
        self.chat = ChatController.chat_base("openai")
        self.visited = set()
        self.use_playwright = use_playwright
        self.seen_products = set()  # Track unique product links

    # ==============================
    # PAGE AND PRODUCT EXTRACTION
    # ==============================
    def _is_price(self, text):
        return bool(re.search(r'(\$|€|£|\d+(?:[.,]\d{2}))', text))

    def _looks_like_product_container(self, tag):
        """Heuristically detect if a tag likely contains a product."""
        has_img = bool(tag.find('img'))
        has_price = any(self._is_price(t.get_text()) for t in tag.find_all(['span', 'div', 'p']))
        has_text = len(tag.get_text(strip=True)) > 20
        return has_img and has_price and has_text

    def _extract_raw_product_blocks(self, soup):
        """Find all blocks that look like product containers."""
        candidates = []
        for tag in soup.find_all(['div', 'li', 'article']):
            if self._looks_like_product_container(tag):
                candidates.append(tag)
        return candidates

    # ==============================
    # AI STRUCTURING (BATCHED)
    # ==============================
    def _ai_structure_batch(self, products_batch):
        """Send multiple products at once for structuring."""
        system_prompt = (
            "You are an expert in e-commerce data extraction. "
            "You will receive a list of raw product texts with image URLs. "
            "Return a JSON object with a 'products' key containing an array where each element has: "
            "{name, price, description, image_url, product_link}. "
            "You must respond with valid JSON only."
        )

        user_message = json.dumps(products_batch, ensure_ascii=False)

        try:
            response = self.chat.send(
                system_prompt=system_prompt,
                user_message=user_message,
                response_format={"type": "json_object"},  # ✅ JSON mode
                max_tokens=2000,
                model="gpt-4o-mini"  # ✅ Valid model
            )
            
            # Handle the response content
            content = response.get("content")
            
            if not content:
                print("Warning: Empty response from API")
                return products_batch
                
            # OpenAI adapter already parses JSON, so content is a dict
            if isinstance(content, dict):
                structured = content
            elif isinstance(content, str):
                if content.strip():
                    structured = json.loads(content)
                else:
                    print("Warning: Empty string response")
                    return products_batch
            else:
                structured = content
                
            # Extract products array from response
            if isinstance(structured, dict) and "products" in structured:
                return structured["products"]
            elif isinstance(structured, dict):
                # If it's a dict but no 'products' key, wrap it in a list
                return [structured]
            elif isinstance(structured, list):
                return structured
            else:
                return products_batch
                
        except Exception as e:
            print(f"Batch structuring failed: {e}")
            import traceback
            traceback.print_exc()
            return products_batch  # fallback

    def _extract_products_from_page(self, url):
        """Extract all product data from a single page."""
        if self.use_playwright:
            soup, final_url = fetch_page_playwright(url)
        else:
            soup, final_url = fetch_page(url)
        if not soup:
            return []

        blocks = self._extract_raw_product_blocks(soup)
        raw_products = []

        for block in blocks:
            raw_text = block.get_text(separator=" ", strip=True)
            img_tag = block.find("img")
            img_url = urljoin(final_url, img_tag.get("src") or img_tag.get("data-src", "")) if img_tag else ""
            link_tag = block.find("a", href=True)
            product_link = urljoin(final_url, link_tag["href"]) if link_tag else url

            # ✅ Skip if we've already seen this product link
            if product_link in self.seen_products:
                continue
            
            self.seen_products.add(product_link)

            raw_products.append({
                "raw_text": raw_text,
                "image_url": img_url,
                "product_link": product_link
            })

            if len(raw_products) >= self.max_products:
                break

        # Process in batches of 5
        products = []
        batch_size = 5
        for i in range(0, len(raw_products), batch_size):
            batch = raw_products[i:i + batch_size]
            structured_batch = self._ai_structure_batch(batch)
            products.extend(structured_batch)
            time.sleep(0.5)  # slight delay for rate limits

        print(f"Extracted {len(products)} products from {url}")
        return products

    # ==============================
    # CRAWLER LOGIC
    # ==============================
    def _normalize_url(self, url):
        """Remove query params and fragments from URL."""
        parsed = urlparse(url)
        return f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
    
    def _find_internal_links(self, soup, base_url, domain):
        """Find potential product listing pages."""
        links = set()
        for a in soup.find_all("a", href=True):
            href = a["href"]
            full_url = urljoin(base_url, href)
            parsed = urlparse(full_url)
            if domain in parsed.netloc and parsed.path not in ["/", ""]:
                # ✅ Skip individual product pages - only crawl collections/categories
                if "/products/" in parsed.path:
                    continue
                # ignore non-product pages
                if not any(x in parsed.path for x in ["login", "cart", "account", "contact", "policy", "terms", "blogs", "pages"]):
                    links.add(self._normalize_url(full_url))
        return list(links)

    def _is_listing_page(self, soup):
        """Check if page has multiple products (3+)"""
        blocks = self._extract_raw_product_blocks(soup)
        return len(blocks) >= 3

    def crawl_site(self, url, depth=0):
        """Recursively crawl site and extract products."""
        # ✅ Normalize URL before checking visited
        normalized_url = self._normalize_url(url)
        
        if depth > self.max_depth or normalized_url in self.visited:
            return []

        self.visited.add(normalized_url)
        print(f"[Depth {depth}] Visiting: {normalized_url}")

        soup, final_url = fetch_page_playwright(url)
        if not soup:
            return []

        products = []
        
        # ✅ Only extract from listing pages
        if self._is_listing_page(soup):
            print(f"  → Listing page detected, extracting products...")
            products = self._extract_products_from_page(final_url)
        else:
            print(f"  → Not a listing page (< 3 products), skipping...")
        
        # Continue crawling for more products
        if len(products) < self.max_products:
            domain = urlparse(final_url).netloc
            links = self._find_internal_links(soup, final_url, domain)
            print(f"  → Found {len(links)} internal links to explore")
            for link in links[:5]:
                products += self.crawl_site(link, depth + 1)
                if len(products) >= self.max_products:
                    break

        return products


# ==============================
# MAIN SCRIPT ENTRY POINT
# ==============================
def main():
    if len(sys.argv) < 2:
        print("Usage: python product_extractor.py <url>")
        sys.exit(1)

    url = sys.argv[1]
    extractor = SmartProductExtractorAI(max_products=20, max_depth=2)
    products = extractor.crawl_site(url)

    print("\n--- Extracted Products ---\n")
    print(json.dumps(products, indent=4, ensure_ascii=False))


if __name__ == "__main__":
    main()
